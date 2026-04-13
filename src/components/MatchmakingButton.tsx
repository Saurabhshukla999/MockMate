import React, { useState } from "react";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, X } from "lucide-react";

const SKILLS = ["JavaScript", "Python", "System Design", "DSA", "React", "Node.js", "SQL", "Java"];

export function MatchmakingButton() {
  const { status, error, joinQueue, leaveQueue } = useMatchmaking();
  const [selectedSkill, setSelectedSkill] = useState("");

  if (status === "waiting") {
    return (
      <div className="flex flex-col items-center gap-3 p-6 border border-dashed border-yellow-500/40 rounded-xl bg-yellow-500/5">
        <div className="flex items-center gap-2 text-yellow-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Finding your match...</span>
        </div>
        <p className="text-sm text-muted-foreground">We'll redirect you automatically when a peer is found.</p>
        <Button variant="ghost" size="sm" onClick={leaveQueue} className="text-red-400 hover:text-red-300">
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-6 border border-border rounded-xl">
      <h3 className="font-semibold text-lg">Find a Practice Partner</h3>
      <Select value={selectedSkill} onValueChange={setSelectedSkill}>
        <SelectTrigger>
          <SelectValue placeholder="Select a skill to practice..." />
        </SelectTrigger>
        <SelectContent>
          {SKILLS.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        onClick={() => joinQueue(selectedSkill)}
        disabled={!selectedSkill}
        className="w-full"
      >
        <Users className="h-4 w-4 mr-2" />
        Find Match
      </Button>
    </div>
  );
}
