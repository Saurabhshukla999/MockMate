import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, PenTool, MessageSquare, PhoneOff, Mic, MicOff, VideoOff } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    connectionState,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC(sessionId);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = async () => {
    await endCall();
    navigate("/dashboard");
  };

  const statusConfig = (() => {
    if (connectionState === "connecting") {
      return {
        dotClass: "bg-yellow-400 animate-pulse",
        label: "Connecting...",
      };
    }
    if (connectionState === "connected") {
      return {
        dotClass: "bg-green-500",
        label: "Connected",
      };
    }
    if (connectionState === "failed") {
      return {
        dotClass: "bg-red-500",
        label: "Connection failed - check your network",
      };
    }
    return {
      dotClass: "bg-muted-foreground",
      label: connectionState,
    };
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        <div className="grid gap-4 lg:grid-cols-3 flex-1 min-h-0">
          {/* Video area */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="gradient-card border-border h-full flex flex-col overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Session Room
                </CardTitle>
                <div className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded">
                  ID: {sessionId?.split('-')[0]}...
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-1 sm:p-4 overflow-hidden">
                <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                  
                  {/* Remote Video (Main) */}
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="mx-auto h-24 w-24 rounded-full bg-secondary/10 flex items-center justify-center animate-pulse">
                        <Video className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground text-sm">Waiting for peer to join...</p>
                    </div>
                  )}

                  {/* Local Video (PiP) */}
                  <div className="absolute top-4 right-4 w-24 sm:w-32 md:w-48 aspect-video bg-zinc-900 rounded-lg overflow-hidden border-2 border-primary/30 shadow-2xl transition-all duration-300 hover:border-primary">
                    {localStream && !isVideoOff ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted // Mute local video to prevent feedback loop
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }} // Mirror the user's camera
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20">
                        <VideoOff className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">Camera Off</span>
                      </div>
                    )}
                  </div>

                  {/* Connection status */}
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs text-foreground backdrop-blur-md shadow-md">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotClass}`} />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Controls overlay */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 shadow-xl transition-all opacity-90 hover:opacity-100">
                    <Button
                      variant={isAudioMuted ? "destructive" : "secondary"}
                      size="icon"
                      className="rounded-full h-12 w-12 hover:scale-105 transition-transform"
                      onClick={toggleAudio}
                      title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant={isVideoOff ? "destructive" : "secondary"}
                      size="icon"
                      className="rounded-full h-12 w-12 hover:scale-105 transition-transform"
                      onClick={toggleVideo}
                      title={isVideoOff ? "Turn on Camera" : "Turn off Camera"}
                    >
                      {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                    <div className="w-px h-8 bg-border mx-1"></div>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="rounded-full h-12 w-12 hover:scale-105 transition-transform shadow-md shadow-destructive/20"
                      onClick={handleEndCall}
                      title="End Call"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: whiteboard + chat */}
          <div className="flex flex-col gap-4 min-h-0">
            <Card className="gradient-card border-border flex-[0.8] flex flex-col min-h-0">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-accent" /> Whiteboard
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center overflow-auto">
                <p className="text-xs text-muted-foreground text-center px-4">Collaborative whiteboard coming soon</p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end p-4 pt-0">
                <div className="flex-1 overflow-y-auto mb-4 flex flex-col justify-end">
                  <p className="text-xs text-muted-foreground text-center">Chat messages will appear here</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Input placeholder="Type a message..." className="text-sm" disabled />
                  <Button size="sm" disabled>Send</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRoom;
