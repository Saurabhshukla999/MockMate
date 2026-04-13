import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Swords, User, MapPin, UserX } from "lucide-react";

interface MatchedPeer {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  college: string | null;
  skills: string[];
  experience_level: string | null;
  city: string | null;
  country: string | null;
  match_score: number;
}

const FindMatch = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchedPeer[]>([]);
  const [hasSkills, setHasSkills] = useState(false);

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setLoading(true);
      setMatches([]);

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("skills")
          .eq("user_id", user.id)
          .single();

        const skills = (profile?.skills as string[] | null) ?? [];
        setHasSkills(skills.length > 0);

        if (skills.length === 0) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("match-peer", {
          body: { user_id: user.id },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        });

        if (error) throw new Error(error.message);

        const list = (data?.matches ?? []) as MatchedPeer[];
        setMatches(list);
      } catch (err) {
        toast({
          title: "Error",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user]);

  const handleRequestInterview = async (peer: MatchedPeer) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          user_a: user.id,
          user_b: peer.user_id,
          skill: peer.skills[0] ?? "General",
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;
      toast({
        title: "Interview requested!",
        description: `Request sent to ${peer.display_name ?? peer.full_name ?? "Peer"}`,
      });
    } catch (err) {
      toast({
        title: "Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const displayName = (p: MatchedPeer) =>
    p.display_name ?? p.full_name ?? "Peer";

  const locationStr = (p: MatchedPeer) =>
    [p.city, p.country].filter(Boolean).join(", ") || "Location not set";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-2xl p-4 pt-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-5 w-72 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-36" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl p-4 pt-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gradient flex items-center gap-2">
            <Swords className="h-7 w-7" /> Find a Match
          </h1>
          <p className="text-muted-foreground mt-1">
            Peers matched by skills, experience level, and location
          </p>
        </div>

        {!hasSkills ? (
          <Card className="gradient-card border-border">
            <CardContent className="pt-6 text-center py-10">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Complete your profile and add skills to find matches.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <a href="/profile/setup">Go to Profile Setup</a>
              </Button>
            </CardContent>
          </Card>
        ) : matches.length === 0 ? (
          <Card className="gradient-card border-border">
            <CardContent className="pt-6 text-center py-12">
              <UserX className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium text-foreground">No matches found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adding more skills or check back later when more peers sign up.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/profile/setup">Update Profile</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((peer) => (
              <Card key={peer.user_id} className="gradient-card border-border">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-lg">
                          {displayName(peer)}
                        </p>
                        {peer.college && (
                          <p className="text-sm text-muted-foreground">{peer.college}</p>
                        )}
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {locationStr(peer)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {peer.skills.slice(0, 5).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {peer.experience_level && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {peer.experience_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className="bg-primary/20 text-primary font-mono">
                        {peer.match_score}% match
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleRequestInterview(peer)}
                      >
                        Request Interview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindMatch;