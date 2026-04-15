import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MatchResult {
  session_id: string;
  matched_with: string;
}

export function useWebRTC(sessionId: string | undefined) {

  // 1. State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');

  // 2. Refs (never trigger re-renders)
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const processedIceCandidates = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function init() {
      // Step A: get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Step B: fetch session row
      const { data: session } = await (supabase.from('sessions') as any)
        .select('id, user_a, user_b, skill, offer, answer, ice_candidates_a, ice_candidates_b')
        .eq('id', sessionId)
        .single();
      if (!session || cancelled) return;

      const amICaller = user.id === session.user_a;

      // Step C: get local media
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

      // Step D: create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Remote stream handler
      pc.ontrack = (e) => { if (e.streams[0]) setRemoteStream(e.streams[0]); };

      // Connection state
      pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);

      // ICE candidates: save to DB
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        const candidateJson = JSON.stringify(e.candidate.toJSON());
        const col = amICaller ? 'ice_candidates_a' : 'ice_candidates_b';
        // fetch current array then append
        const { data: current } = await (supabase.from('sessions') as any)
          .select(col).eq('id', sessionId).single();
        const existing: any[] = current?.[col] ?? [];
        await (supabase.from('sessions') as any)
          .update({ [col]: [...existing, e.candidate.toJSON()] })
          .eq('id', sessionId);
      };

      // Step E: Subscribe to Realtime updates on this session row
      const channel = supabase
        .channel(`session-${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'sessions',
          filter: `id=eq.${sessionId}`
        }, async (payload) => {
          const row = payload.new as any;
          await handleSignalingUpdate(row, pc, amICaller);
        })
        .subscribe();
      channelRef.current = channel;

      // Step F: Caller creates and saves offer
      if (amICaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await (supabase.from('sessions') as any)
          .update({ offer: JSON.stringify(offer) })
          .eq('id', sessionId);
      } else {
        // Step G: Callee checks if offer already exists (in case update fired before sub)
        if (session.offer) {
          await applyOffer(pc, session, sessionId);
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
      // Caller: watch for answer
      if (row.answer && !pc.remoteDescription) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(row.answer)));
        } catch(e) { console.error('setRemoteDescription answer error', e); }
      }
      // Caller: watch for callee ICE candidates
      const candidates: any[] = row.ice_candidates_b ?? [];
      for (const c of candidates) {
        const key = JSON.stringify(c);
        if (!processedIceCandidates.current.has(key) && pc.remoteDescription) {
          processedIceCandidates.current.add(key);
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
      }
    } else {
      // Callee: watch for offer
      if (row.offer && !pc.remoteDescription) {
        await applyOffer(pc, row, row.id ?? sessionId);
      }
      // Callee: watch for caller ICE candidates
      const candidates: any[] = row.ice_candidates_a ?? [];
      for (const c of candidates) {
        const key = JSON.stringify(c);
        if (!processedIceCandidates.current.has(key) && pc.remoteDescription) {
          processedIceCandidates.current.add(key);
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
      }
    }
  }

  async function applyOffer(pc: RTCPeerConnection, row: any, sid: string) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(row.offer)));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await (supabase.from('sessions') as any)
        .update({ answer: JSON.stringify(answer) })
        .eq('id', sid);
    } catch(e) { console.error('applyOffer error', e); }
  }

  function cleanup() {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    channelRef.current?.unsubscribe();
  }

  // Controls
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
