import { View, Text, TextInput, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../../lib/tw';
import { useTheme } from '../../lib/theme';
import { getAdminSession, clearAdminSession } from '../../lib/storage';
import { fetchAllTourists, fetchAlerts, fetchRiskZones } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

function Metric({ label, value, icon, tone, dark }) {
  const toneColors = { green: '#10b981', amber: '#f5a524', red: '#f31260', blue: dark ? '#fff' : '#000' };
  const color = toneColors[tone] || (dark ? '#fff' : '#000');
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return (
    <View style={[tw`rounded-2xl p-4 flex-row items-center gap-3`, {
      backgroundColor: dark ? '#111111' : '#ffffff', borderWidth: 1, borderColor: border,
    }]}>
      <Text style={tw`text-2xl`}>{icon}</Text>
      <View>
        <Text style={[tw`text-xs uppercase tracking-widest`, { color: dark ? '#a1a1aa' : '#52525b', fontSize: 9 }]}>{label}</Text>
        <Text style={[tw`text-2xl font-black mt-0.5`, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function AlertCard({ alert, dark }) {
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const heading = dark ? '#fff' : '#000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  return (
    <View style={[tw`rounded-xl p-4`, { backgroundColor: dark ? '#000' : '#fff', borderWidth: 1, borderColor: border }]}>
      <View style={tw`flex-row flex-wrap items-start justify-between gap-2`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center gap-2 flex-wrap`}>
            <Text style={[tw`text-sm font-bold`, { color: heading }]}>{alert.touristName || alert.touristId}</Text>
            <StatusBadge value={alert.severity} />
          </View>
          <Text style={[tw`mt-2 text-sm`, { color: dark ? '#ededed' : '#18181b' }]}>{alert.message}</Text>
          {alert.suggestion && <Text style={[tw`mt-1 text-xs italic`, { color: muted }]}>{alert.suggestion}</Text>}
        </View>
        <Text style={[tw`text-xs`, { color: muted }]}>{new Date(alert.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const { dark } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tourists, setTourists] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const bg = dark ? '#000000' : '#ffffff';
  const heading = dark ? '#ffffff' : '#000000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const brand = dark ? '#ffffff' : '#000000';
  const brandText = dark ? '#000000' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const surface = dark ? '#111111' : '#ffffff';
  const inputBg = dark ? '#000' : '#fff';

  useEffect(() => {
    getAdminSession().then((s) => { setSession(s); setAuthChecked(true); });
  }, []);

  const loadData = useCallback(async () => {
    const [tRes, aRes, zRes] = await Promise.all([
      fetchAllTourists(), fetchAlerts(), fetchRiskZones(),
    ]);
    setTourists(tRes.data?.tourists || []);
    setAlerts(aRes.data?.alerts || []);
    setZones(zRes.data?.zones || []);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!session) return;
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, [loadData, session]);

  const criticalCount = useMemo(() => alerts.filter((a) => a.severity === 'critical').length, [alerts]);
  const sosCount = useMemo(() => alerts.filter((a) => a.type === 'sos').length, [alerts]);
  const watchCount = useMemo(() => tourists.filter((t) => t.status === 'watch' || t.status === 'critical').length, [tourists]);
  const avgScore = useMemo(() => {
    if (!tourists.length) return 0;
    return Math.round(tourists.reduce((s, t) => s + (t.safetyScore || 0), 0) / tourists.length);
  }, [tourists]);
  const filteredAlerts = useMemo(() => {
    if (filterSeverity === 'all') return alerts;
    return alerts.filter((a) => a.severity === filterSeverity);
  }, [alerts, filterSeverity]);
  const filteredTourists = useMemo(() => {
    if (!searchQuery) return tourists;
    const q = searchQuery.toLowerCase();
    return tourists.filter((t) => t.fullName?.toLowerCase().includes(q) || t.touristId?.toLowerCase().includes(q));
  }, [tourists, searchQuery]);

  if (!authChecked) return null;

  if (!session) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-6`, { backgroundColor: bg }]}>
        <Text style={[tw`text-xl font-bold mb-3`, { color: heading }]}>Admin Access Required</Text>
        <Text style={[tw`text-sm text-center mb-6`, { color: muted }]}>Log in with admin credentials to view the control room.</Text>
        <TouchableOpacity onPress={() => router.push('/login')} style={[tw`rounded-xl px-8 py-3.5`, { backgroundColor: brand }]}>
          <Text style={[tw`text-sm font-bold`, { color: brandText }]}>Admin Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tabs = ['overview', 'tourists', 'alerts', 'zones'];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={tw`px-4 pb-10 gap-5 pt-4`}>
        {/* Header */}
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <Text style={[tw`text-xs font-semibold uppercase tracking-widest`, { color: muted }]}>Admin Control Room</Text>
            <Text style={[tw`text-xl font-bold`, { color: heading }]}>Safety Command Center</Text>
          </View>
          <TouchableOpacity
            onPress={() => { clearAdminSession(); setSession(null); }}
            style={[tw`rounded-xl px-4 py-2`, { borderWidth: 1, borderColor: border }]}
          >
            <Text style={[tw`text-xs font-semibold`, { color: '#f31260' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* SOS banner */}
        {sosCount > 0 && (
          <View style={[tw`flex-row items-center gap-3 rounded-2xl p-4`, {
            borderWidth: 2, borderColor: '#f31260', backgroundColor: 'rgba(243,18,96,0.1)',
          }]}>
            <Text style={tw`text-2xl`}>🆘</Text>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-lg font-black`, { color: '#f31260' }]}>ACTIVE SOS EMERGENCY</Text>
              <Text style={[tw`text-sm`, { color: heading }]}>{sosCount} panic alert{sosCount > 1 ? 's' : ''} — respond immediately.</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:112')} style={[tw`rounded-xl px-4 py-2.5`, { backgroundColor: '#f31260' }]}>
              <Text style={[tw`font-bold text-sm`, { color: '#fff' }]}>📞 112</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Metrics */}
        <View style={tw`gap-3`}>
          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}><Metric label="Tourists" value={tourists.length} icon="👤" tone="blue" dark={dark} /></View>
            <View style={tw`flex-1`}><Metric label="At Risk" value={watchCount} icon="⚠️" tone="amber" dark={dark} /></View>
          </View>
          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}><Metric label="Critical" value={criticalCount} icon="🚨" tone="red" dark={dark} /></View>
            <View style={tw`flex-1`}><Metric label="Avg Score" value={`${avgScore}/100`} icon="🛡️" tone="green" dark={dark} /></View>
          </View>
        </View>

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[tw`flex-row gap-1 rounded-xl p-1`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                style={[tw`rounded-lg px-4 py-2`, activeTab === tab && { backgroundColor: brand }]}>
                <Text style={[tw`text-sm font-semibold capitalize`, { color: activeTab === tab ? brandText : muted }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <View style={tw`gap-5`}>
            <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <Text style={[tw`text-lg font-semibold`, { color: heading }]}>Live Incidents</Text>
                <Text style={[tw`text-xs`, { color: muted }]}>
                  {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
                </Text>
              </View>
              <View style={tw`gap-3`}>
                {alerts.slice(0, 8).map((a) => <AlertCard key={a._id || a.id || a.createdAt} alert={a} dark={dark} />)}
                {!alerts.length && <Text style={[tw`text-sm`, { color: muted }]}>No active alerts ✅</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Tourists tab */}
        {activeTab === 'tourists' && (
          <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-lg font-semibold mb-3`, { color: heading }]}>Tourist Watchlist</Text>
            <TextInput
              placeholder="Search by name or ID…"
              placeholderTextColor={muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[tw`rounded-lg px-3 py-2 text-sm mb-4`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border, color: heading, minHeight: 40 }]}
            />
            {filteredTourists.map((t) => (
              <View key={t.touristId} style={[tw`py-3 gap-1`, { borderBottomWidth: 1, borderBottomColor: border }]}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-semibold`, { color: heading }]}>{t.fullName}</Text>
                    <Text style={[tw`text-xs`, { color: muted, fontFamily: 'monospace' }]}>{t.touristId}</Text>
                  </View>
                  <StatusBadge value={t.status} />
                </View>
                <View style={tw`flex-row items-center justify-between mt-1`}>
                  <Text style={[tw`text-xs`, { color: muted }]}>Score: {t.safetyScore || 0}</Text>
                  <Text style={[tw`text-xs`, { color: t.trackingConsent ? '#10b981' : '#f31260' }]}>
                    {t.trackingConsent ? '✓ Tracking' : '✗ No tracking'}
                  </Text>
                </View>
              </View>
            ))}
            {!filteredTourists.length && <Text style={[tw`text-sm mt-2`, { color: muted }]}>No tourists found.</Text>}
          </View>
        )}

        {/* Alerts tab */}
        {activeTab === 'alerts' && (
          <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-lg font-semibold mb-3`, { color: heading }]}>All Alerts ({filteredAlerts.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
              <View style={[tw`flex-row gap-1 rounded-xl p-1`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}>
                {['all', 'critical', 'warning', 'open'].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setFilterSeverity(s)}
                    style={[tw`rounded-lg px-3 py-1.5`, filterSeverity === s && { backgroundColor: brand }]}>
                    <Text style={[tw`text-xs font-semibold capitalize`, { color: filterSeverity === s ? brandText : muted }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={tw`gap-3`}>
              {filteredAlerts.map((a) => <AlertCard key={a._id || a.id || a.createdAt} alert={a} dark={dark} />)}
              {!filteredAlerts.length && <Text style={[tw`text-sm`, { color: muted }]}>No alerts found.</Text>}
            </View>
          </View>
        )}

        {/* Zones tab */}
        {activeTab === 'zones' && (
          <View style={[tw`rounded-2xl p-5`, { backgroundColor: surface, borderWidth: 1, borderColor: border }]}>
            <Text style={[tw`text-lg font-semibold mb-4`, { color: heading }]}>Zone Registry ({zones.length})</Text>
            <View style={tw`gap-3`}>
              {zones.map((zone) => (
                <View key={zone.zoneId || zone.name} style={[tw`rounded-xl p-4`, { backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}>
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={[tw`font-semibold`, { color: heading }]}>{zone.name}</Text>
                    <StatusBadge value={zone.severity} />
                  </View>
                  <View style={[tw`h-1.5 rounded-full overflow-hidden mb-2`, { backgroundColor: border }]}>
                    <View style={[tw`h-full rounded-full`, {
                      backgroundColor: zone.severity === 'critical' ? '#f31260' : '#f5a524',
                      width: zone.severity === 'critical' ? '92%' : '60%',
                    }]} />
                  </View>
                  <Text style={[tw`text-xs`, { color: muted }]}>{zone.radiusMeters}m radius · {zone.type}</Text>
                  <Text style={[tw`text-xs mt-1`, { color: muted }]}>{zone.advice}</Text>
                </View>
              ))}
              {!zones.length && <Text style={[tw`text-sm`, { color: muted }]}>No risk zones configured.</Text>}
            </View>
          </View>
        )}

        {loading && session && (
          <Text style={[tw`text-sm text-center`, { color: muted }]}>Loading dashboard data…</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
