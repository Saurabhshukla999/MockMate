/**
 * Reverse geocode coordinates to city and country using Nominatim (OpenStreetMap).
 * Free, no API key required. Respects 1 req/sec limit.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string }> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MockMate-PeerPracticeHub/1.0 (Profile Setup)" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = (await res.json()) as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
      state?: string;
      country?: string;
    };
  };
  const addr = data.address ?? {};
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? addr.state ?? "";
  const country = addr.country ?? "";
  return { city, country };
}
