import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Adjacent experience levels
const LEVEL_ORDER = ["beginner", "intermediate", "advanced"] as const;
function isSameOrAdjacentLevel(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  const i = LEVEL_ORDER.indexOf(a as typeof LEVEL_ORDER[number]);
  const j = LEVEL_ORDER.indexOf(b as typeof LEVEL_ORDER[number]);
  if (i === -1 || j === -1) return true;
  return Math.abs(i - j) <= 1;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  college: string | null;
  skills: string[] | null;
  experience_level: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  elo_rating: number;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ matches: [], error: "user_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch current user's profile
    const { data: myProfile, error: myError } = await supabase
      .from("profiles")
      .select("skills, experience_level, city, country, latitude, longitude")
      .eq("user_id", user_id)
      .single();

    if (myError || !myProfile) {
      return new Response(
        JSON.stringify({ matches: [], error: "Profile not found. Complete your profile first." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mySkills = (myProfile.skills as string[]) ?? [];
    if (mySkills.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], error: "Add skills to your profile to find matches." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch all profiles (service role bypasses RLS), exclude self
    const { data: allProfiles, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, full_name, college, skills, experience_level, city, country, latitude, longitude, elo_rating")
      .neq("user_id", user_id);

    if (error) throw error;

    const candidates: ProfileRow[] = (allProfiles ?? []).filter(
      (p) => p.skills && Array.isArray(p.skills) && (p.skills as string[]).some((s) => mySkills.includes(s))
    );

    // 3. Filter by experience_level (same or adjacent)
    const filtered = candidates.filter((p) =>
      isSameOrAdjacentLevel(myProfile.experience_level as string | null, p.experience_level)
    );

    const myCity = (myProfile.city as string)?.toLowerCase().trim() || "";
    const myCountry = (myProfile.country as string)?.toLowerCase().trim() || "";
    const myLat = (myProfile.latitude as number) ?? 0;
    const myLon = (myProfile.longitude as number) ?? 0;

    // 4 & 5: Sort by locality, then by Haversine distance; compute match_score
    const scored: (ProfileRow & { match_score: number })[] = filtered.map((p) => {
      const pCity = (p.city as string)?.toLowerCase().trim() || "";
      const pCountry = (p.country as string)?.toLowerCase().trim() || "";
      const pLat = (p.latitude as number) ?? 0;
      const pLon = (p.longitude as number) ?? 0;

      const sameCity = myCity && pCity && myCity === pCity;
      const sameCountry = myCountry && pCountry && myCountry === pCountry;

      let localityBonus = 0; // 0 = global, 1 = same country, 2 = same city
      if (sameCity) localityBonus = 2;
      else if (sameCountry) localityBonus = 1;

      const dist = haversineDistance(myLat, myLon, pLat, pLon);
      const distScore = Math.max(0, 100 - dist); // 0–100, closer = higher

      const sharedSkills = ((p.skills as string[]) ?? []).filter((s) => mySkills.includes(s));
      const skillScore = (sharedSkills.length / mySkills.length) * 50; // up to 50

      const match_score = Math.round(
        skillScore + localityBonus * 25 + Math.min(25, distScore)
      );
      return { ...p, match_score };
    });

    scored.sort((a, b) => b.match_score - a.match_score);
    const top5 = scored.slice(0, 5);

    const matches: MatchedPeer[] = top5.map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      full_name: p.full_name,
      college: p.college,
      skills: (p.skills as string[]) ?? [],
      experience_level: p.experience_level,
      city: p.city,
      country: p.country,
      match_score: p.match_score,
    }));

    return new Response(
      JSON.stringify({ matches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ matches: [], error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
