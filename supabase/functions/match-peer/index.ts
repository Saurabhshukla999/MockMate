import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user from JWT
    // Use service role client + getUser(token) to verify ES256 tokens server-side
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ── GET ?action=status ─────────────────────────────────────────
    if (req.method === "GET" && action === "status") {
      const { data: entry, error } = await supabase
        .from("matchmaking_queue")
        .select("session_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!entry) {
        // Not in queue at all
        return json({ status: "not_in_queue" });
      }

      if (entry.session_id) {
        // Matched! Get session details
        const { data: session } = await supabase
          .from("sessions")
          .select("id, user_a, user_b")
          .eq("id", entry.session_id)
          .single();

        const matched_with = session?.user_a === user.id ? session?.user_b : session?.user_a;

        // Remove from queue now that they've been notified
        await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);

        return json({ status: "matched", session_id: entry.session_id, matched_with });
      }

      return json({ status: "waiting" });
    }

    // ── DELETE ?action=leave ───────────────────────────────────────
    if (req.method === "DELETE" && action === "leave") {
      await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
      return json({ status: "left" });
    }

    // ── POST — Join queue ──────────────────────────────────────────
    if (req.method === "POST") {
      const { skill } = await req.json();

      if (!skill) {
        return json({ error: "skill is required" }, 400);
      }

      // 1. Remove any stale entry for this user (idempotent re-join)
      await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);

      // 2. Look for another user waiting for the same skill (oldest first), not us
      const { data: opponent, error: findErr } = await supabase
        .from("matchmaking_queue")
        .select("user_id")
        .eq("skill", skill)
        .is("session_id", null)
        .neq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (findErr) throw findErr;

      if (opponent) {
        // ✅ Found a match! Create a session
        const { data: session, error: sessionErr } = await supabase
          .from("sessions")
          .insert({
            user_a: opponent.user_id,
            user_b: user.id,
            skill,
            scheduled_at: new Date().toISOString(),
            status: "active",
          })
          .select()
          .single();

        if (sessionErr) throw sessionErr;

        // Update opponent's queue entry with session_id so their poll picks it up
        await supabase
          .from("matchmaking_queue")
          .update({ session_id: session.id })
          .eq("user_id", opponent.user_id);

        // Remove current user from queue (they get the result immediately)
        await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);

        return json({
          status: "matched",
          session_id: session.id,
          matched_with: opponent.user_id,
        });
      }

      // 3. No match found — add ourselves to the queue
      const { error: insertErr } = await supabase
        .from("matchmaking_queue")
        .insert({ user_id: user.id, skill });

      if (insertErr) throw insertErr;

      return json({ status: "waiting" });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
