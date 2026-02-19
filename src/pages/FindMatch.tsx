import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Swords, Loader2, User } from "lucide-react";

const SKILLS = ["DSA", "React", "DBMS", "OS", "CN", "System Design", "JavaScript", "Python", "C++", "SQL"];

interface MatchedPeer {
  user_id: string;
  display_name: string | null;
  college: string | null;
  elo_rating: number;
}

const FindMatch = () => {
  const { user } = useAuth();
  const [skill, setSkill] = useState("");
  const [searching, setSearching] = useState(false);
  const [matched, setMatched] = useState<MatchedPeer | null>(null);
  const [myElo, setMyElo] = useState(1200);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("elo_rating").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setMyElo(data.elo_rating);
    });
  }, [user]);

  const findMatch = async () => {
    if (!user || !skill) return;
    setSearching(true);
    setMatched(null);

    try {
      const response = await supabase.functions.invoke("match-peer", {
        body: { skill, user_id: user.id, elo_rating: myElo },
      });

      if (response.error) throw new Error(response.error.message);
      const data = response.data;

      if (data?.match) {
        setMatched(data.match);
        toast({ title: "Match found!", description: `Matched with ${data.match.display_name}` });
      } else {
        toast({ title: "No match found", description: "Try a different skill or try again later.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-xl p-4 pt-8">
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-gradient">Find a Match</CardTitle>
            <CardDescription>Select a skill to find a peer with similar Elo rating (±200)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {SKILLS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={findMatch} disabled={!skill || searching} className="w-full">
              {searching ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</> : <><Swords className="mr-2 h-4 w-4" /> Find Match</>}
            </Button>

            {matched && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold">{matched.display_name ?? "Peer"}</p>
                      <p className="text-sm text-muted-foreground">{matched.college ?? "Unknown college"}</p>
                      <Badge variant="outline" className="mt-1">Elo: {matched.elo_rating}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FindMatch;
