import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tw';
import { useTheme } from '../lib/theme';
import { fetchRiskZones } from '../lib/api';
import StatusBadge from '../components/StatusBadge';

export default function RiskZonesScreen() {
  const { dark } = useTheme();
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const bg = dark ? '#000000' : '#ffffff';
  const heading = dark ? '#ffffff' : '#000000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const surface = dark ? '#111111' : '#ffffff';
  const inputBg = dark ? '#000' : '#fff';

  useEffect(() => {
    fetchRiskZones().then((res) => {
      setZones(res.data?.zones || []);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={tw`px-4 pb-10 pt-4`}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={tw`py-3`}>
          <Text style={[tw`text-sm font-semibold`, { color: muted }]}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={tw`items-center py-6 gap-2`}>
          <Text style={[tw`text-xs font-semibold uppercase tracking-widest`, { color: muted }]}>
            Geo-fencing
          </Text>
          <Text style={[tw`text-2xl font-bold text-center`, { color: heading }]}>Risk Zones</Text>
          <Text style={[tw`text-sm text-center`, { color: muted }]}>
            Restricted and high-risk areas checked with Haversine distance function.
          </Text>
        </View>

        {loading ? (
          <View style={tw`items-center py-8`}>
            <ActivityIndicator size="large" color={heading} />
          </View>
        ) : (
          <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-lg font-semibold mb-4`, { color: heading }]}>
              Monitored Risk Zones ({zones.length})
            </Text>
            <View style={tw`gap-3`}>
              {zones.map((zone) => (
                <View
                  key={zone.zoneId || zone.name}
                  style={[tw`rounded-xl p-5`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}
                >
                  <View style={tw`flex-row flex-wrap items-center justify-between gap-3`}>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`font-semibold`, { color: heading }]}>{zone.name}</Text>
                      <Text style={[tw`text-xs uppercase tracking-widest`, { color: muted }]}>{zone.type}</Text>
                    </View>
                    <StatusBadge value={zone.severity} />
                  </View>
                  <View style={tw`mt-3 gap-1`}>
                    <Text style={[tw`text-sm`, { color: dark ? '#ededed' : '#18181b' }]}>
                      Lat: {zone.latitude}  ·  Lng: {zone.longitude}
                    </Text>
                    <Text style={[tw`text-sm`, { color: dark ? '#ededed' : '#18181b' }]}>
                      Radius: {zone.radiusMeters}m
                    </Text>
                    <Text style={[tw`text-sm mt-1`, { color: muted }]}>{zone.advice}</Text>
                  </View>
                </View>
              ))}
              {!zones.length && <Text style={[tw`text-sm`, { color: muted }]}>No risk zones configured.</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
