import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../../lib/tw';
import { useTheme } from '../../lib/theme';

const FEATURES = [
  { title: 'Digital Tourist ID', text: 'Trip-duration ID with SHA-256 integrity verification.' },
  { title: 'Opt-in Tracking', text: 'Tourist consent controls whether location updates are stored.' },
  { title: 'Geo-Fencing', text: 'Haversine checks against restricted and high-risk zones.' },
  { title: 'SOS Response', text: 'Critical panic alerts appear instantly on the admin dashboard.' },
  { title: 'AI Rules', text: 'Simple anomaly scoring for no movement, signal drops, and route deviation.' },
  { title: 'Mobile Ready', text: 'Native Android app with the same features as the web dashboard.' },
];

function FeatureCard({ title, text, dark }) {
  return (
    <View
      style={[
        tw`rounded-2xl p-5`,
        {
          backgroundColor: dark ? '#111111' : '#ffffff',
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
      ]}
    >
      <Text style={[tw`text-base font-bold mb-2`, { color: dark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[tw`text-sm leading-relaxed`, { color: dark ? '#a1a1aa' : '#52525b' }]}>{text}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { dark, toggle } = useTheme();
  const router = useRouter();

  const bg = dark ? '#000000' : '#ffffff';
  const heading = dark ? '#ffffff' : '#000000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const brand = dark ? '#ffffff' : '#000000';
  const brandText = dark ? '#000000' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const surface = dark ? '#111111' : '#ffffff';

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={tw`px-4 pb-8`}>
        {/* Header */}
        <View style={tw`flex-row items-center justify-between py-4`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View
              style={[
                tw`h-12 w-12 rounded-xl items-center justify-center`,
                { backgroundColor: surface, borderWidth: 1, borderColor: border },
              ]}
            >
              <Text style={tw`text-xl`}>🛡️</Text>
            </View>
            <View>
              <Text style={[tw`text-lg font-semibold`, { color: heading }]}>Geo Guard</Text>
              <Text style={[tw`text-xs`, { color: muted }]}>Tourist Safety Command</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={toggle}
            style={[
              tw`rounded-full px-3 py-2`,
              { borderWidth: 1, borderColor: border },
            ]}
          >
            <Text style={[tw`text-xs font-medium`, { color: muted }]}>
              {dark ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={tw`items-center py-8 gap-4`}>
          <Text
            style={[tw`text-xs font-semibold uppercase tracking-widest`, { color: muted }]}
          >
            Tourist Guide
          </Text>
          <Text
            style={[tw`text-2xl font-bold text-center leading-8`, { color: heading }]}
          >
            Smart Tourist Safety Monitoring & Incident Response System
          </Text>
          <Text
            style={[tw`text-sm text-center leading-6`, { color: muted }]}
          >
            Register tourists, issue temporary digital IDs, track opt-in live locations, detect risk zones, trigger SOS alerts, and monitor incidents.
          </Text>

          {/* Action buttons */}
          <View style={tw`flex-row flex-wrap gap-3 mt-4 justify-center`}>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              style={[tw`rounded-xl px-6 py-3.5`, { backgroundColor: brand }]}
            >
              <Text style={[tw`text-sm font-bold`, { color: brandText }]}>Register as Tourist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={[
                tw`rounded-xl px-6 py-3.5`,
                { backgroundColor: surface, borderWidth: 1, borderColor: border },
              ]}
            >
              <Text style={[tw`text-sm font-bold`, { color: heading }]}>Admin Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={tw`gap-3`}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} dark={dark} />
          ))}
        </View>

        {/* Quick nav */}
        <View style={tw`mt-6 gap-3`}>
          <TouchableOpacity
            onPress={() => router.push('/risk-zones')}
            style={[
              tw`rounded-xl px-5 py-4 flex-row items-center justify-between`,
              { backgroundColor: surface, borderWidth: 1, borderColor: border },
            ]}
          >
            <Text style={[tw`text-sm font-bold`, { color: heading }]}>⚠️ View Risk Zones</Text>
            <Text style={{ color: muted }}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
