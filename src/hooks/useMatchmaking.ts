import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client"; // adjust path if needed
import { useNavigate } from "react-router-dom";

type MatchStatus = "idle" | "waiting" | "matched" | "error";

interface MatchResult {
  session_id: string;
  matched_with: string;
}

export function useMatchmaking() {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchedWith, setMatchedWith] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-peer`;

  // Helper: get current user's JWT
  const getAuthHeader = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not authenticated");
    return { Authorization: `Bearer ${token}` };
  }, []);

  // ── JOIN QUEUE ────────────────────────────────────────────────
  const joinQueue = useCallback(async (skill: string) => {
    setError(null);
    setStatus("waiting");

    try {
      const headers = await getAuthHeader();
      const res = await fetch(EDGE_FN_URL, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ skill }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join queue");
      }

      if (data.status === "matched") {
        handleMatched(data as MatchResult);
        return;
      }

      // Start polling every 4 seconds
      startPolling();
    } catch (e: any) {
      setStatus("error");
      setError(e.message);
    }
  }, []);

  // ── LEAVE QUEUE ───────────────────────────────────────────────
  const leaveQueue = useCallback(async () => {
    stopPolling();
    setStatus("idle");
    setError(null);

    try {
      const headers = await getAuthHeader();
      await fetch(`${EDGE_FN_URL}?action=leave`, {
        method: "DELETE",
        headers,
      });
    } catch (_) {
      // silently ignore leave errors
    }
  }, []);

  // ── POLL STATUS ───────────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${EDGE_FN_URL}?action=status`, {
        method: "GET",
        headers,
      });
      const data = await res.json();

      if (data.status === "matched") {
        handleMatched(data as MatchResult);
      } else if (data.status === "not_in_queue") {
        // Queue entry expired or was removed externally
        stopPolling();
        setStatus("idle");
      }
    } catch (_) {
      // network hiccup, keep polling
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(pollStatus, 4000);
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleMatched = useCallback((result: MatchResult) => {
    stopPolling();
    setStatus("matched");
    setSessionId(result.session_id);
    setMatchedWith(result.matched_with);
    // Navigate to the session room
    navigate(`/session/${result.session_id}`);
  }, [navigate, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    status,       // "idle" | "waiting" | "matched" | "error"
    sessionId,
    matchedWith,
    error,
    joinQueue,    // call with skill string e.g. joinQueue("JavaScript")
    leaveQueue,
  };
}
