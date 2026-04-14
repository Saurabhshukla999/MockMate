import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
  ],
};

export const useWebRTC = (sessionId: string | undefined) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pc: RTCPeerConnection | null = null;
    let currentStream: MediaStream | null = null;

    const setup = async () => {
      if (!sessionId) return;
      
      try {
        // Request user media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // If unmounted while waiting for permissions, stop immediately
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        setLocalStream(stream);
        currentStream = stream;

        // Initialize PeerConnection
        pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to the connection
        stream.getTracks().forEach((track) => pc!.addTrack(track, stream));

        // When remote tracks are received, set them to state
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // Initialize Supabase Broadcast channel for signaling
        const channel = supabase.channel(`room:${sessionId}`, {
          config: { broadcast: { self: false } }, // Don't receive our own messages
        });
        channelRef.current = channel;

        // Handle sending ICE candidates to peer
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'webrtc_signaling',
              payload: { type: 'ice-candidate', candidate: event.candidate },
            });
          }
        };

        let makingOffer = false;

        // Handle incoming signaling messages
        channel.on('broadcast', { event: 'webrtc_signaling' }, async ({ payload }) => {
          if (payload.type === 'offer') {
            await pc!.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc!.createAnswer();
            await pc!.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'webrtc_signaling',
              payload: { type: 'answer', answer },
            });
          } else if (payload.type === 'answer') {
            await pc!.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } else if (payload.type === 'ice-candidate') {
            try {
              if (pc!.remoteDescription) {
                await pc!.addIceCandidate(new RTCIceCandidate(payload.candidate));
              }
            } catch (e) {
              console.error('Error adding received ice candidate', e);
            }
          } else if (payload.type === 'user-joined') {
            // Initiate offer when someone joins 
            // Avoid collisions by only one trying to make an offer if possible, but WebRTC can handle polite/impolite peers, 
            // here we'll keep it simple
            if (!makingOffer && pc!.signalingState === 'stable') {
              makingOffer = true;
              const offer = await pc!.createOffer();
              await pc!.setLocalDescription(offer);
              channel.send({
                type: 'broadcast',
                event: 'webrtc_signaling',
                payload: { type: 'offer', offer },
              });
              makingOffer = false;
            }
          }
        });

        // Subscribe to channel and announce presence
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            channel.send({
              type: 'broadcast',
              event: 'webrtc_signaling',
              payload: { type: 'user-joined' },
            });
          }
        });
        
      } catch (err) {
        console.error("Failed to setup WebRTC:", err);
      }
    };

    setup();

    // Cleanup function
    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (pc) {
        pc.close();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId]);

  // Expose toggle controls
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
  };
};
