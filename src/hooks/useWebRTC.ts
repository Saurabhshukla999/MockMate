import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Supabase Realtime delivers payload.new as already-parsed objects,
// but a regular .select() returns text columns as strings.
// This helper safely handles both.
function parseSDP(value: string | object | null | undefined): RTCSessionDescriptionInit {
  if (!value) throw new Error('SDP value is empty');
  if (typeof value === 'string') return JSON.parse(value);
  return value as RTCSessionDescriptionInit;
}

export function useWebRTC(sessionId: string | undefined) {

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const processedIceCandidates = useRef<Set<string>>(new Set());
  const amICallerRef = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function init() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Fetch session row
      const { data: session } = await supabase
        .from('sessions')
        .select('id, user_a, user_b, skill, offer, answer, ice_candidates_a, ice_candidates_b')
        .eq('id', sessionId!)
        .single();
      if (!session || cancelled) return;

      const amICaller = user.id === session.user_a;
      amICallerRef.current = amICaller;

      // Get local media
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch {
          console.error('Could not access camera/mic');
          return;
        }
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => { if (e.streams[0]) setRemoteStream(e.streams[0]); };
      pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);

      // ICE candidates: save to DB column for our side
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        const col = amICaller ? 'ice_candidates_a' : 'ice_candidates_b';
        const { data: current } = await supabase
          .from('sessions')
          .select(col)
          .eq('id', sessionId!)
          .single();
        const existing = (current?.[col] as unknown[]) ?? [];
        await supabase
          .from('sessions')
          .update({ [col]: [...existing, e.candidate.toJSON()] })
          .eq('id', sessionId!);
      };

      // Subscribe to Realtime updates on this session row
      const channel = supabase
        .channel(`session-${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'sessions',
          filter: `id=eq.${sessionId}`
        }, async (payload) => {
          const row = payload.new as typeof session;
          await handleSignalingUpdate(row, pc, amICaller);
        })
        .subscribe();
      channelRef.current = channel;

      // Caller creates and saves offer
      if (amICaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await supabase
          .from('sessions')
          .update({ offer: JSON.stringify(offer) })
          .eq('id', sessionId!);
      } else {
        // Callee: if offer already exists in DB (race-condition guard)
        if (session.offer) {
          await applyOffer(pc, session.offer, sessionId!);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [sessionId]);

  async function handleSignalingUpdate(row: any, pc: RTCPeerConnection, amICaller: boolean) {
    if (amICaller) {
      // Watch for answer from callee
      if (row.answer && !pc.remoteDescription) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(parseSDP(row.answer)));
          // Now apply any buffered callee ICE candidates
          await applyIceCandidates(pc, row.ice_candidates_b ?? []);
        } catch(e) { console.error('setRemoteDescription answer error', e); }
      } else if (pc.remoteDescription) {
        await applyIceCandidates(pc, row.ice_candidates_b ?? []);
      }
    } else {
      // Watch for offer from caller
      if (row.offer && !pc.remoteDescription) {
        await applyOffer(pc, row.offer, row.id ?? sessionId!);
      } else if (pc.remoteDescription) {
        await applyIceCandidates(pc, row.ice_candidates_a ?? []);
      }
    }
  }

  async function applyOffer(pc: RTCPeerConnection, offerJson: string, sid: string) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(parseSDP(offerJson)));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await supabase
        .from('sessions')
        .update({ answer: JSON.stringify(answer) })
        .eq('id', sid);
    } catch(e) { console.error('applyOffer error', e); }
  }

  async function applyIceCandidates(pc: RTCPeerConnection, candidates: unknown[]) {
    for (const c of candidates) {
      const key = JSON.stringify(c);
      if (!processedIceCandidates.current.has(key)) {
        processedIceCandidates.current.add(key);
        try { await pc.addIceCandidate(new RTCIceCandidate(c as RTCIceCandidateInit)); } catch {}
      }
    }
  }

  function cleanup() {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    channelRef.current?.unsubscribe();
  }

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsAudioMuted(!track.enabled); }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
  };

  const endCall = async () => {
    cleanup();
    if (sessionId) {
      await supabase.from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);
    }
  };

  return { localStream, remoteStream, isAudioMuted, isVideoOff,
           connectionState, toggleAudio, toggleVideo, endCall };
}
