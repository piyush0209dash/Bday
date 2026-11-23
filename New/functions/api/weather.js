// Cloudflare Pages Function: live weather for Khurda (Open-Meteo, no API key needed)
export async function onRequestGet() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=20.1822&longitude=85.615&current=temperature_2m,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&wind_speed_unit=ms&timezone=Asia%2FKolkata";
  try {
    const r = await fetch(url, { cf: { cacheTtl: 600, cacheEverything: true } });
    const j = await r.json();
    return new Response(JSON.stringify(j.current || {}), { headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } });
  } catch (e) {
    return new Response("{}", { headers: { "content-type": "application/json" } });
  }
}
