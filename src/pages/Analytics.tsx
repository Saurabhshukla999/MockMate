import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Target, TrendingUp } from "lucide-react";

const MOCK_RATING_DATA = [
  { date: "Jan", rating: 1200 },
  { date: "Feb", rating: 1230 },
  { date: "Mar", rating: 1215 },
  { date: "Apr", rating: 1260 },
  { date: "May", rating: 1290 },
  { date: "Jun", rating: 1275 },
];

const Analytics = () => {
  const { user } = useAuth();
  const [elo, setElo] = useState(1200);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("elo_rating").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setElo(data.elo_rating);
    });
    supabase.from("sessions").select("id", { count: "exact" }).or(`user_a.eq.${user.id},user_b.eq.${user.id}`).then(({ count }) => {
      if (count) setSessionCount(count);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-8">
        <h1 className="font-display text-3xl font-bold mb-6 text-gradient">Analytics</h1>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Current Rating</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold">{elo}</p></CardContent>
          </Card>
          <Card className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Sessions</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold">{sessionCount}</p></CardContent>
          </Card>
          <Card className="gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold text-green-400">+{elo - 1200}</p></CardContent>
          </Card>
        </div>

        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Rating Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_RATING_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[1100, 1400]} />
                  <Tooltip contentStyle={{ background: "hsl(222 44% 10%)", border: "1px solid hsl(222 25% 18%)", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="rating" stroke="hsl(15 85% 60%)" strokeWidth={2} dot={{ fill: "hsl(15 85% 60%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Mock data — real trend will populate as you complete sessions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
