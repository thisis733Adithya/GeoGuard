import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=auto`
    );
    const data = await res.json();

    const code = data.current?.weathercode ?? 0;
    const temp = data.current?.temperature_2m ?? "--";
    const wind = data.current?.windspeed_10m ?? 0;
    const humidity = data.current?.relative_humidity_2m ?? 0;

    return NextResponse.json({
      temperature: temp,
      weathercode: code,
      description: getWeatherDescription(code),
      icon: getWeatherIcon(code),
      wind,
      humidity,
      safetyTip: getSafetyTip(code, wind),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getWeatherDescription(code) {
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Freezing Drizzle";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rainy";
  if (code <= 79) return "Snowfall";
  if (code <= 84) return "Rain Showers";
  if (code <= 94) return "Thunderstorm";
  return "Violent Thunderstorm";
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 9) return "🌫️";
  if (code <= 39) return "🌧️";
  if (code <= 69) return "🌦️";
  if (code <= 79) return "❄️";
  if (code <= 84) return "🌨️";
  return "⛈️";
}

function getSafetyTip(code, wind) {
  if (code >= 80) return "⚠️ Severe weather warning. Stay indoors and avoid travel.";
  if (code >= 60) return "🌧️ Heavy rain expected. Carry an umbrella and avoid low-lying areas.";
  if (code >= 40) return "🌦️ Light rain possible. Keep valuables protected.";
  if (wind > 40) return "💨 High winds. Secure loose items and avoid open areas.";
  if (code === 0) return "✅ Clear weather. Great day for sightseeing!";
  return "🌤️ Mild weather. Comfortable for outdoor activities.";
}
