import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { skill, user_id, elo_rating } = await req.json();

    if (!skill || !user_id) {
      return new Response(JSON.stringify({ error: "skill and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find peers with same skill within ±200 Elo, excluding self
    const { data: candidates, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, college, elo_rating, skills")
      .contains("skills", [skill])
      .neq("user_id", user_id)
      .gte("elo_rating", (elo_rating || 1200) - 200)
      .lte("elo_rating", (elo_rating || 1200) + 200)
      .limit(10);

    if (error) throw error;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ match: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick closest Elo
    const sorted = candidates.sort(
      (a, b) => Math.abs(a.elo_rating - (elo_rating || 1200)) - Math.abs(b.elo_rating - (elo_rating || 1200))
    );
    const match = sorted[0];

    // Create a session
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .insert({
        user_a: user_id,
        user_b: match.user_id,
        skill,
        status: "pending",
      })
      .select("id")
      .single();

    if (sessionErr) throw sessionErr;

    return new Response(
      JSON.stringify({
        match: {
          user_id: match.user_id,
          display_name: match.display_name,
          college: match.college,
          elo_rating: match.elo_rating,
        },
        session_id: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
