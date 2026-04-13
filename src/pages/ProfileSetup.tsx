import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { reverseGeocode } from "@/lib/geolocation";

const SKILLS = [
  "DSA",
  "React",
  "System Design",
  "DBMS",
  "OS",
  "CN",
  "JavaScript",
  "Python",
  "C++",
  "SQL",
  "Machine Learning",
  "DevOps",
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIME_SLOTS = [
  { id: "morning", label: "Morning (9am–12pm)" },
  { id: "afternoon", label: "Afternoon (12pm–5pm)" },
  { id: "evening", label: "Evening (5pm–9pm)" },
] as const;

function slotId(day: string, timeId: string) {
  return `${day.toLowerCase().slice(0, 3)}_${timeId}`;
}

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [college, setCollege] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setCollege(data.college ?? "");
          setBio(data.bio ?? "");
          setSkills((data.skills as string[]) ?? []);
          setExperienceLevel(data.experience_level ?? "");
          setAvailabilitySlots((data.availability_slots as string[]) ?? []);
          setCity(data.city ?? "");
          setCountry(data.country ?? "");
          setLatitude(data.latitude ?? null);
          setLongitude(data.longitude ?? null);
        }
      });
  }, [user]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleAvailabilitySlot = (slot: string) => {
    setAvailabilitySlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { city: c, country: co } = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setCity(c);
          setCountry(co);
          toast({ title: "Location detected", description: `${c}, ${co}` });
        } catch {
          toast({
            title: "Geocoding failed",
            description: "Could not resolve location. You can enter it manually.",
            variant: "destructive",
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        toast({
          title: "Location denied",
          description: err.message || "Please allow location access or enter manually.",
          variant: "destructive",
        });
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        full_name: displayName,
        college,
        bio,
        skills,
        experience_level: experienceLevel || null,
        availability_slots: availabilitySlots,
        city: city || null,
        country: country || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .eq("user_id", user.id);
    setIsSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl p-4 pt-8">
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-gradient">Profile Setup</CardTitle>
            <CardDescription>Tell us about yourself to find the best matches</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="How should we call you?"
                />
              </div>

              <div className="space-y-2">
                <Label>College</Label>
                <Input
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. DTU, NSUT, IIITD"
                />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short intro about yourself"
                />
              </div>

              <div className="space-y-3">
                <Label>Skills (select all that apply)</Label>
                <div className="flex flex-wrap gap-3">
                  {SKILLS.map((skill) => (
                    <label
                      key={skill}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                        skills.includes(skill)
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={skills.includes(skill)}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Availability slots (when you can practice)</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DAYS.map((day) => (
                    <div key={day} className="rounded-lg border border-border p-3 space-y-2">
                      <span className="text-sm font-medium text-foreground">{day}</span>
                      <div className="flex flex-wrap gap-2">
                        {TIME_SLOTS.map((ts) => {
                          const id = slotId(day, ts.id);
                          return (
                            <label
                              key={id}
                              className={`flex items-center gap-1.5 cursor-pointer rounded-md border px-2 py-1.5 text-xs transition-colors ${
                                availabilitySlots.includes(id)
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border text-muted-foreground hover:border-primary/50"
                              }`}
                            >
                              <Checkbox
                                checked={availabilitySlots.includes(id)}
                                onCheckedChange={() => toggleAvailabilitySlot(id)}
                              />
                              {ts.label.split(" ")[0]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location (city, country)</Label>
                <div className="flex gap-2">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="flex-1"
                  />
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    title="Detect my location"
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the map pin to auto-detect using your browser&apos;s location
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
