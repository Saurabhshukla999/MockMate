import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, PenTool, MessageSquare, PhoneOff } from "lucide-react";

const SessionRoom = () => {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-4">
        <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-6rem)]">
          {/* Video area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="gradient-card border-border h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Session Room
                </CardTitle>
                <Button variant="destructive" size="sm">
                  <PhoneOff className="h-4 w-4 mr-1" /> End
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-32 w-32 rounded-full bg-secondary flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Video placeholder — real-time video coming soon</p>
                  <p className="text-xs text-muted-foreground">Session ID: {sessionId}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: whiteboard + chat */}
          <div className="space-y-4 flex flex-col">
            <Card className="gradient-card border-border flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-accent" /> Whiteboard
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-xs text-muted-foreground">Collaborative whiteboard coming soon</p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground text-center">Chat messages will appear here</p>
                </div>
                <div className="flex gap-2">
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
