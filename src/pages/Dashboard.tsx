import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Swords, Trophy, Clock, BookOpen, MapPin, GraduationCap, User } from "lucide-react";
import { MatchmakingButton } from "@/components/MatchmakingButton";

interface Profile {
  display_name: string | null;
  elo_rating: number;
  skills: string[] | null;
  college: string | null;
  bio: string | null;
  experience_level: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  availability_slots: string[] | null;
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
      .select("display_name, elo_rating, skills, college, bio, experience_level, city, country, avatar_url, availability_slots")
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

  const displayName = profile?.display_name ?? "Peer";
  const initials = displayName.slice(0, 2).toUpperCase();
  const locationStr = [profile?.city, profile?.country].filter(Boolean).join(", ") || null;
  const experienceLabel =
    profile?.experience_level === "beginner"
      ? "Beginner"
      : profile?.experience_level === "intermediate"
        ? "Intermediate"
        : profile?.experience_level === "advanced"
          ? "Advanced"
          : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-8 max-w-4xl">
        {/* Profile card */}
        <Card className="gradient-card border-border mb-8">
          <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-border">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-xl font-display">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="font-display text-2xl text-gradient">{displayName}</CardTitle>
              {profile?.college && (
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <GraduationCap className="h-4 w-4 shrink-0" /> {profile.college}
                </CardDescription>
              )}
              {experienceLabel && (
                <Badge variant="secondary" className="mt-2">{experienceLabel}</Badge>
              )}
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/match">
                <Swords className="mr-2 h-5 w-5" /> Find a Match
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {profile?.bio && (
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            )}
            {locationStr && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" /> {locationStr}
              </p>
            )}
            {(profile?.skills ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(profile?.skills ?? []).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
            {(profile?.skills ?? []).length === 0 && (
              <Link to="/profile/setup" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline pt-2">
                <User className="h-4 w-4" /> Complete your profile →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Stats row */}
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
              <p className="text-2xl font-display font-bold">{(profile?.skills ?? []).length}</p>
              <Link to="/profile/setup" className="text-xs text-primary hover:underline">Edit profile</Link>
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

        <div className="mb-8">
          <MatchmakingButton />
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
