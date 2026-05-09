import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import tw from '../lib/tw';
import { useTheme } from '../lib/theme';
import { fetchWeather } from '../lib/api';

export default function WeatherWidget({ location }) {
  const { dark } = useTheme();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    setLoading(true);
    fetchWeather(location.latitude, location.longitude)
      .then((res) => {
        if (res.ok) setWeather(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [location?.latitude, location?.longitude]);

  if (!location) return null;

  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const heading = dark ? '#fff' : '#000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const textC = dark ? '#ededed' : '#18181b';
  const bgInner = dark ? '#000' : '#fff';

  return (
    <View style={[tw`rounded-2xl p-5`, { backgroundColor: bg, borderWidth: 1, borderColor: border }]}>
      <Text style={[tw`text-base font-semibold`, { color: heading }]}>Weather & Safety</Text>
      {loading ? (
        <View style={tw`mt-3 flex-row items-center gap-2`}>
          <ActivityIndicator size="small" color={heading} />
          <Text style={[tw`text-sm`, { color: muted }]}>Fetching weather…</Text>
        </View>
      ) : weather && !weather.error ? (
        <View style={tw`mt-3 gap-3`}>
          <View style={tw`flex-row items-center gap-4`}>
            <Text style={tw`text-4xl`}>{weather.icon}</Text>
            <View>
              <Text style={[tw`text-2xl font-black`, { color: heading }]}>{weather.temperature}°C</Text>
              <Text style={[tw`text-sm`, { color: muted }]}>{weather.description}</Text>
            </View>
            <View style={tw`ml-auto items-end gap-1`}>
              <Text style={[tw`text-xs`, { color: muted }]}>💨 {weather.wind} km/h</Text>
              <Text style={[tw`text-xs`, { color: muted }]}>💧 {weather.humidity}%</Text>
            </View>
          </View>
          <View
            style={[
              tw`rounded-xl px-4 py-3`,
              { backgroundColor: bgInner, borderWidth: 1, borderColor: border },
            ]}
          >
            <Text style={[tw`text-sm`, { color: textC }]}>{weather.safetyTip}</Text>
          </View>
        </View>
      ) : (
        <Text style={[tw`mt-3 text-sm`, { color: muted }]}>Weather data unavailable.</Text>
      )}
    </View>
  );
}
