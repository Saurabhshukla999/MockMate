import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Swords, UserX, Loader2, Sparkles } from "lucide-react";
import { useMatchmaking } from "@/hooks/useMatchmaking";

const FindMatch = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  const { status, joinQueue, leaveQueue, error } = useMatchmaking();

  useEffect(() => {
    if (!user) return;

    const fetchSkills = async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("skills")
          .eq("user_id", user.id)
          .single();

        const userSkills = (profile?.skills as string[] | null) ?? [];
        setSkills(userSkills);
        if (userSkills.length > 0) {
          setSelectedSkill(userSkills[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-2xl p-4 pt-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-5 w-72 mb-8" />
          <Skeleton className="h-64 w-full rounded-xl" />
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
            Enter the live matchmaking queue to pair with a peer of a similar experience level.
          </p>
        </div>

        {skills.length === 0 ? (
          <Card className="gradient-card border-border">
            <CardContent className="pt-6 text-center py-10">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Complete your profile and add skills to find matches.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/profile/setup">Go to Profile Setup</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="gradient-card border-border overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center">
              {status === "idle" || status === "error" ? (
                <>
                  <Sparkles className="h-12 w-12 text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Select a Skill</h2>
                  <p className="text-muted-foreground mb-6 text-sm max-w-sm">
                    Choose the skill you want to practice. We'll find someone with roughly the same experience level.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {skills.map(skill => (
                      <Badge 
                        key={skill} 
                        variant={selectedSkill === skill ? "default" : "outline"}
                        className={`text-sm py-1.5 px-4 cursor-pointer transition-all ${
                          selectedSkill === skill ? 'scale-105 shadow-md' : 'hover:bg-primary/10'
                        }`}
                        onClick={() => setSelectedSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-md mb-4">
                      {error}
                    </div>
                  )}

                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-8"
                    onClick={() => selectedSkill && joinQueue(selectedSkill)}
                    disabled={!selectedSkill}
                  >
                    Join Matchmaking Queue
                  </Button>
                </>
              ) : status === "waiting" ? (
                <div className="py-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="bg-background border-2 border-primary rounded-full p-4 relative">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold mt-6 mb-2">Searching for a Match...</h2>
                  <p className="text-muted-foreground mb-8">
                    Looking for a peer to practice <strong className="text-foreground">{selectedSkill}</strong> with you.
                  </p>
                  <Button variant="outline" onClick={leaveQueue}>
                    Cancel Search
                  </Button>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center">
                  <Swords className="h-12 w-12 text-green-500 mb-4 animate-bounce" />
                  <h2 className="text-xl font-semibold mb-2 text-green-500">Match Found!</h2>
                  <p className="text-muted-foreground">
                    Redirecting to your session...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FindMatch;