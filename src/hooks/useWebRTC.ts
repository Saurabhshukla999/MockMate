import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SessionRow = {
  id: string;
  user_a: string;
  user_b: string;
  skill: string | null;
  offer: string | null;
  answer: string | null;
  ice_candidates_a: string | null;
  ice_candidates_b: string | null;
};

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const safeParseArray = (value: unknown): RTCIceCandidateInit[] => {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as RTCIceCandidateInit[]) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) return value as RTCIceCandidateInit[];
  return [];
};

const safeParseDesc = (value: unknown): RTCSessionDescriptionInit | null => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as RTCSessionDescriptionInit;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as RTCSessionDescriptionInit;
  return null;
};

export function useWebRTC(sessionId: string | undefined) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("new");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const amICallerRef = useRef<boolean>(false);
  const processedRemoteIceRef = useRef<number>(0);

  useEffect(() => {
    if (!sessionId) return;
    let disposed = false;

    const setup = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user;
      if (!currentUser || disposed) return;

      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData || disposed) return;

      const session = sessionData as unknown as SessionRow;
      const amICaller = currentUser.id === session.user_a;
      amICallerRef.current = amICaller;
      processedRemoteIceRef.current = 0;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      }

      if (disposed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsAudioMuted(stream.getAudioTracks()[0] ? !stream.getAudioTracks()[0].enabled : true);
      setIsVideoOff(stream.getVideoTracks()[0] ? !stream.getVideoTracks()[0].enabled : true);

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [firstRemoteStream] = event.streams;
        if (firstRemoteStream) setRemoteStream(firstRemoteStream);
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate || !sessionId) return;

        const field = amICallerRef.current ? "ice_candidates_a" : "ice_candidates_b";
        const { data: row } = await supabase
          .from("sessions")
          .select(field)
          .eq("id", sessionId)
          .single();

        const currentArr = safeParseArray((row as Record<string, unknown> | null)?.[field]);
        const updatedArr = [...currentArr, event.candidate.toJSON()];

        await supabase
          .from("sessions")
          .update({ [field]: JSON.stringify(updatedArr) })
          .eq("id", sessionId);
      };

      const handleSignalingUpdate = async (newRowRaw: Record<string, unknown>) => {
        const activePc = pcRef.current;
        if (!activePc) return;

        if (amICallerRef.current) {
          const answerDesc = safeParseDesc(newRowRaw.answer);
          if (answerDesc && !activePc.remoteDescription) {
            await activePc.setRemoteDescription(new RTCSessionDescription(answerDesc));
          }

          const calleeCandidates = safeParseArray(newRowRaw.ice_candidates_b);
          for (let i = processedRemoteIceRef.current; i < calleeCandidates.length; i += 1) {
            await activePc.addIceCandidate(new RTCIceCandidate(calleeCandidates[i]));
          }
          processedRemoteIceRef.current = calleeCandidates.length;
          return;
        }

        const offerDesc = safeParseDesc(newRowRaw.offer);
        if (offerDesc && !activePc.remoteDescription) {
          await activePc.setRemoteDescription(new RTCSessionDescription(offerDesc));
          const answer = await activePc.createAnswer();
          await activePc.setLocalDescription(answer);
          await supabase
            .from("sessions")
            .update({ answer: JSON.stringify(answer) })
            .eq("id", sessionId);
        }

        const callerCandidates = safeParseArray(newRowRaw.ice_candidates_a);
        for (let i = processedRemoteIceRef.current; i < callerCandidates.length; i += 1) {
          await activePc.addIceCandidate(new RTCIceCandidate(callerCandidates[i]));
        }
        processedRemoteIceRef.current = callerCandidates.length;
      };

      channelRef.current = supabase
        .channel(`session:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${sessionId}`,
          },
          async (payload) => {
            await handleSignalingUpdate(payload.new as Record<string, unknown>);
          },
        )
        .subscribe();

      if (amICaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await supabase
          .from("sessions")
          .update({ offer: JSON.stringify(offer) })
          .eq("id", sessionId);
      } else {
        await handleSignalingUpdate(session as unknown as Record<string, unknown>);
      }
    };

    void setup();

    return () => {
      disposed = true;

      const ls = localStreamRef.current;
      if (ls) {
        ls.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);

      if (pcRef.current) {
        pcRef.current.close();
      }
      pcRef.current = null;
      setConnectionState("closed");

      if (channelRef.current) {
        void channelRef.current.unsubscribe();
      }
      channelRef.current = null;
    };
  }, [sessionId]);

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioMuted(!track.enabled);
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  const endCall = async () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
      setConnectionState("closed");
    }

    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (sessionId) {
      await supabase.from("sessions").update({ status: "completed" }).eq("id", sessionId);
    }
  };

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    connectionState,
    toggleAudio,
    toggleVideo,
    endCall,
  };
}
