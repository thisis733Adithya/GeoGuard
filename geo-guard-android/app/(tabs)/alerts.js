import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../../lib/tw';
import { useTheme } from '../../lib/theme';
import { fetchAlerts } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function AlertsScreen() {
  const { dark } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const bg = dark ? '#000000' : '#ffffff';
  const heading = dark ? '#ffffff' : '#000000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const surface = dark ? '#111111' : '#ffffff';
  const inputBg = dark ? '#000' : '#fff';

  const loadAlerts = useCallback(async () => {
    const res = await fetchAlerts();
    setAlerts(res.data?.alerts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 4000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={tw`px-4 pb-10 pt-4`}>
        {/* Header */}
        <View style={tw`items-center py-6 gap-2`}>
          <Text style={[tw`text-xs font-semibold uppercase tracking-widest`, { color: muted }]}>
            Incident History
          </Text>
          <Text style={[tw`text-2xl font-bold text-center`, { color: heading }]}>Alerts</Text>
          <Text style={[tw`text-sm text-center`, { color: muted }]}>
            Normal, warning, and critical events stored with timestamps and location context.
          </Text>
        </View>

        {loading ? (
          <View style={tw`items-center py-8`}>
            <ActivityIndicator size="large" color={heading} />
          </View>
        ) : (
          <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <View style={tw`gap-3`}>
              {alerts.length ? alerts.map((alert) => (
                <View
                  key={alert._id || alert.id || alert.createdAt}
                  style={[tw`rounded-xl p-5`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}
                >
                  <View style={tw`flex-row flex-wrap items-center justify-between gap-3`}>
                    <View>
                      <Text style={[tw`text-sm font-semibold capitalize`, { color: heading }]}>{alert.type}</Text>
                      <Text style={[tw`text-xs`, { color: muted, fontFamily: 'monospace' }]}>{alert.touristId}</Text>
                    </View>
                    <StatusBadge value={alert.severity} />
                  </View>
                  <Text style={[tw`mt-3 text-sm`, { color: dark ? '#ededed' : '#18181b' }]}>{alert.message}</Text>
                  {alert.suggestion && (
                    <Text style={[tw`mt-1 text-sm`, { color: heading }]}>{alert.suggestion}</Text>
                  )}
                  <Text style={[tw`mt-3 text-xs`, { color: dark ? '#71717a' : '#a1a1aa' }]}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </Text>
                </View>
              )) : (
                <Text style={[tw`text-sm`, { color: muted }]}>No alert records yet.</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
