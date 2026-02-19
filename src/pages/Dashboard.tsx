import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy, Clock, BookOpen } from "lucide-react";

interface Profile {
  display_name: string | null;
  elo_rating: number;
  skills: string[];
  college: string | null;
}

interface Session {
  id: string;
  skill: string;
  status: string;
  scheduled_at: string;
  user_a: string;
  user_b: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("display_name, elo_rating, skills, college")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });

    supabase
      .from("sessions")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("scheduled_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setSessions(data as Session[]);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-8">
        <h1 className="font-display text-3xl font-bold mb-6">
          Welcome, <span className="text-gradient">{profile?.display_name ?? "Peer"}</span>
        </h1>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Elo Rating</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{profile?.elo_rating ?? 1200}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{sessions.length}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Skills</CardTitle>
              <BookOpen className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {(profile?.skills ?? []).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {(profile?.skills ?? []).length === 0 && (
                  <Link to="/profile/setup" className="text-sm text-primary hover:underline">Add skills →</Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mb-8">
          <Button asChild>
            <Link to="/match"><Swords className="mr-2 h-4 w-4" /> Find a Match</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/quizzes"><BookOpen className="mr-2 h-4 w-4" /> Take a Quiz</Link>
          </Button>
        </div>

        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sessions yet. Find a match to get started!</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <Badge variant="outline" className="mr-2">{s.skill}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(s.scheduled_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge className={
                      s.status === "completed" ? "bg-green-600/20 text-green-400" :
                      s.status === "active" ? "bg-primary/20 text-primary" :
                      "bg-secondary text-secondary-foreground"
                    }>
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
