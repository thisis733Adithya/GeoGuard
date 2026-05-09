import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import tw from '../../lib/tw';
import { useTheme } from '../../lib/theme';
import { getTouristId, setTouristId as saveTouristId } from '../../lib/storage';
import {
  fetchTourist, fetchAlerts, fetchRiskZones,
  updateLocation, updateConsent, triggerPanicAlert, createTestZone,
} from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import IdVerifier from '../../components/IdVerifier';
import WeatherWidget from '../../components/WeatherWidget';
import NearbyPlaces from '../../components/NearbyPlaces';

function Info({ label, value, dark }) {
  const bg = dark ? '#000' : '#fff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return (
    <View style={[tw`rounded-xl px-3 py-2`, { backgroundColor: bg, borderWidth: 1, borderColor: border }]}>
      <Text style={[tw`text-xs uppercase tracking-widest`, { color: dark ? '#a1a1aa' : '#52525b', fontSize: 9 }]}>
        {label}
      </Text>
      <Text style={[tw`text-sm font-semibold mt-0.5`, { color: dark ? '#ededed' : '#18181b' }]}>{value}</Text>
    </View>
  );
}

function SafetyRing({ score, dark }) {
  const color =
    score >= 70 ? '#10b981' : score >= 40 ? '#f5a524' : '#f31260';

  return (
    <View style={[tw`items-center justify-center rounded-full`, {
      width: 80, height: 80,
      borderWidth: 4,
      borderColor: color,
      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    }]}>
      <Text style={[tw`text-xl font-black`, { color: dark ? '#fff' : '#000' }]}>{score}</Text>
      <Text style={[tw`uppercase tracking-wide`, { color: dark ? '#a1a1aa' : '#52525b', fontSize: 8 }]}>score</Text>
    </View>
  );
}

export default function TouristScreen() {
  const { dark } = useTheme();
  const [touristId, setTouristId] = useState('');
  const [missingId, setMissingId] = useState('');
  const [tourist, setTourist] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = dark ? '#000000' : '#ffffff';
  const heading = dark ? '#ffffff' : '#000000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const brand = dark ? '#ffffff' : '#000000';
  const brandText = dark ? '#000000' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const surface = dark ? '#111111' : '#ffffff';
  const inputBg = dark ? '#000' : '#fff';

  const loadData = useCallback(async () => {
    if (!touristId) return;
    const [tRes, aRes, zRes] = await Promise.all([
      fetchTourist(touristId), fetchAlerts(), fetchRiskZones(),
    ]);
    if (!tRes.data?.tourist) {
      setTourist(null);
      setMissingId(touristId);
      return;
    }
    setMissingId('');
    setTourist(tRes.data.tourist);
    setAlerts((aRes.data?.alerts || []).filter((a) => a.touristId === touristId));
    setZones(zRes.data?.zones || []);
  }, [touristId]);

  useEffect(() => {
    getTouristId().then((id) => { if (id) setTouristId(id); });
  }, []);

  useEffect(() => {
    if (!touristId) return;
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, [loadData, touristId]);

  async function shareLiveLocation() {
    setLoading(true);
    setMessage('');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setMessage('Location permission denied.');
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const res = await updateLocation(touristId, loc.coords.latitude, loc.coords.longitude);
    if (res.ok) {
      const d = res.data;
      const zoneText = d.geoFenceMatches?.length
        ? ` Entered: ${d.geoFenceMatches.map((m) => m.zone.name).join(', ')}.`
        : '';
      const alertText = d.alerts?.length ? ` ${d.alerts.length} alert created.` : '';
      setMessage(`Location updated. Risk: ${d.anomaly.anomalyType}.${zoneText}${alertText}`);
    } else {
      setMessage(res.data?.error || 'Update failed.');
    }
    await loadData();
    setLoading(false);
  }

  async function handleToggleConsent() {
    if (!tourist) return;
    const res = await updateConsent(touristId, !tourist.trackingConsent);
    if (res.ok) {
      setTourist(res.data.tourist);
      setMessage(res.data.tourist.trackingConsent ? 'Tracking enabled.' : 'Tracking disabled.');
    }
  }

  async function handleSos() {
    if (!tourist) return;
    setLoading(true);
    setMessage('Acquiring emergency location...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat, lng;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } else if (tourist.lastKnownLocation) {
        lat = tourist.lastKnownLocation.latitude;
        lng = tourist.lastKnownLocation.longitude;
      }
      if (lat && lng) {
        const res = await triggerPanicAlert(touristId, lat, lng);
        if (res.ok) {
          setMessage(
            `SOS ${res.data.incidentCode} sent. ${res.data.nearestEmergency.name} is ${res.data.nearestEmergency.distance} away, ETA ${res.data.nearestEmergency.eta}. Call ${res.data.nearestEmergency.phone}.`
          );
        }
        await loadData();
      } else {
        setMessage('Location unavailable.');
      }
    } catch {
      setMessage('SOS failed. Try again.');
    }
    setLoading(false);
  }

  async function handleCreateTestZone() {
    if (!tourist?.lastKnownLocation) {
      setMessage('Share your live location first.');
      return;
    }
    setLoading(true);
    const res = await createTestZone(
      tourist.lastKnownLocation.latitude,
      tourist.lastKnownLocation.longitude
    );
    if (res.ok) {
      setMessage('Test risk zone created! Share location again to trigger geo-fence.');
      await loadData();
    } else {
      setMessage(`Failed: ${res.data?.error}`);
    }
    setLoading(false);
  }

  const activeWarning = useMemo(
    () => alerts.find((a) => a.severity === 'critical' || a.severity === 'warning'),
    [alerts]
  );

  // Login gate
  if (!tourist) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
        <ScrollView contentContainerStyle={tw`px-4 py-8`}>
          <View style={[tw`rounded-2xl p-6`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-xl font-bold mb-2`, { color: heading }]}>Tourist Dashboard</Text>
            <Text style={[tw`text-sm mb-6`, { color: muted }]}>
              {missingId
                ? `Tourist ID "${missingId}" was not found. Please check and try again.`
                : 'Enter your Tourist ID to access your personal safety dashboard.'}
            </Text>
            <View style={tw`flex-row gap-3`}>
              <TextInput
                placeholder="e.g. TID-2026-ABCDE"
                placeholderTextColor={dark ? '#71717a' : '#a1a1aa'}
                value={touristId}
                onChangeText={(v) => setTouristId(v.toUpperCase())}
                autoCapitalize="characters"
                style={[
                  tw`flex-1 rounded-lg px-3 py-2 text-sm`,
                  { backgroundColor: inputBg, borderWidth: 1, borderColor: border, color: heading, fontFamily: 'monospace', minHeight: 44 },
                ]}
              />
              <TouchableOpacity
                onPress={() => { if (touristId) { saveTouristId(touristId); loadData(); } }}
                style={[tw`rounded-lg px-5 justify-center`, { backgroundColor: brand }]}
              >
                <Text style={[tw`font-bold text-sm`, { color: brandText }]}>Load</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard
  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={tw`px-4 pb-10 gap-5 pt-4`}>
        {/* Critical warning banner */}
        {activeWarning && (
          <View
            style={[tw`flex-row items-start gap-3 rounded-2xl p-4`, {
              backgroundColor: 'rgba(243,18,96,0.1)', borderWidth: 1, borderColor: '#f31260',
            }]}
          >
            <Text style={tw`text-2xl`}>🚨</Text>
            <View style={tw`flex-1`}>
              <Text style={[tw`font-bold`, { color: '#f31260' }]}>Active Safety Alert</Text>
              <Text style={[tw`text-sm mt-0.5`, { color: heading }]}>{activeWarning.message}</Text>
              <Text style={[tw`text-xs mt-1`, { color: muted }]}>{activeWarning.suggestion}</Text>
            </View>
          </View>
        )}

        {/* Profile card */}
        <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-xs`, { color: muted, fontFamily: 'monospace' }]}>{tourist.touristId}</Text>
              <Text style={[tw`mt-1 text-xl font-bold`, { color: heading }]}>{tourist.fullName}</Text>
              <Text style={[tw`text-sm`, { color: muted }]}>{tourist.phone}</Text>
            </View>
            <StatusBadge value={tourist.status} />
          </View>

          <View style={tw`mt-5 flex-row items-center gap-4`}>
            <SafetyRing score={tourist.safetyScore || 0} dark={dark} />
            <View style={tw`flex-1 gap-2`}>
              <Info label="Trip Window" value={`${tourist.tripStartDate} → ${tourist.tripEndDate}`} dark={dark} />
              <Info label="Emergency Contact" value={tourist.emergencyContact} dark={dark} />
            </View>
          </View>
        </View>

        {/* Consent toggle */}
        <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-semibold`, { color: heading }]}>Tracking Consent</Text>
              <Text style={[tw`text-xs`, { color: muted }]}>Opt-in location sharing for your trip duration.</Text>
            </View>
            <Switch
              value={tourist.trackingConsent}
              onValueChange={handleToggleConsent}
              trackColor={{ false: '#71717a', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Action buttons */}
        <View style={tw`gap-3`}>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={shareLiveLocation}
              disabled={loading || !tourist.trackingConsent}
              style={[tw`flex-1 rounded-xl py-4 items-center`, { backgroundColor: brand, opacity: loading || !tourist.trackingConsent ? 0.5 : 1 }]}
            >
              <Text style={[tw`font-bold text-sm`, { color: brandText }]}>📍 Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateTestZone}
              disabled={loading || !tourist.lastKnownLocation}
              style={[tw`flex-1 rounded-xl py-4 items-center`, {
                borderWidth: 2, borderColor: '#f5a524',
                backgroundColor: 'rgba(245,165,36,0.1)',
                opacity: loading || !tourist.lastKnownLocation ? 0.5 : 1,
              }]}
            >
              <Text style={[tw`font-bold text-sm`, { color: '#f5a524' }]}>🗺️ Test Zone</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('SOS', 'Are you sure you want to trigger a panic alert?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'SEND SOS', style: 'destructive', onPress: handleSos },
            ])}
            disabled={loading}
            style={[tw`rounded-2xl py-5 items-center`, { backgroundColor: '#f31260', opacity: loading ? 0.5 : 1 }]}
          >
            <Text style={[tw`text-xl font-black`, { color: '#fff' }]}>🆘 PANIC SOS</Text>
          </TouchableOpacity>
        </View>

        {message ? (
          <View style={[tw`rounded-xl p-4`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-sm`, { color: heading }]}>{message}</Text>
          </View>
        ) : null}

        {/* ID Verifier */}
        <IdVerifier initialTouristId={tourist.touristId} />

        {/* Alert History */}
        <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
          <Text style={[tw`text-base font-semibold`, { color: heading }]}>Alert History</Text>
          <View style={tw`mt-3 gap-3`}>
            {alerts.length ? alerts.map((alert) => (
              <View key={alert._id || alert.id || alert.createdAt}
                style={[tw`rounded-xl p-4`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}
              >
                <View style={tw`flex-row items-center justify-between gap-2`}>
                  <Text style={[tw`text-sm font-semibold capitalize`, { color: heading }]}>{alert.type}</Text>
                  <StatusBadge value={alert.severity} />
                </View>
                <Text style={[tw`mt-2 text-sm`, { color: muted }]}>{alert.message}</Text>
                <Text style={[tw`mt-1 text-xs`, { color: dark ? '#71717a' : '#a1a1aa' }]}>
                  {new Date(alert.createdAt).toLocaleString()}
                </Text>
              </View>
            )) : (
              <Text style={[tw`text-sm`, { color: muted }]}>No alerts yet. You are safe! ✅</Text>
            )}
          </View>
        </View>

        {/* Weather */}
        <WeatherWidget location={tourist.lastKnownLocation} />

        {/* Nearby Places */}
        <NearbyPlaces location={tourist.lastKnownLocation} />

        {/* Active Risk Zones */}
        {zones.length > 0 && (
          <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-base font-semibold`, { color: heading }]}>Active Risk Zones</Text>
            <View style={tw`mt-3 gap-3`}>
              {zones.map((zone) => (
                <View key={zone.zoneId || zone.name}
                  style={[tw`flex-row items-center justify-between gap-3 rounded-xl p-4`,
                    { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}
                >
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-sm font-semibold`, { color: heading }]}>{zone.name}</Text>
                    <Text style={[tw`text-xs`, { color: muted }]}>{zone.radiusMeters}m radius · {zone.advice}</Text>
                  </View>
                  <StatusBadge value={zone.severity} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
