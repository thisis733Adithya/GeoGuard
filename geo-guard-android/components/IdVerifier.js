import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import tw from '../lib/tw';
import { useTheme } from '../lib/theme';
import { verifyId } from '../lib/api';
import StatusBadge from './StatusBadge';

export default function IdVerifier({ initialTouristId = '' }) {
  const { dark } = useTheme();
  const [touristId, setTouristId] = useState(initialTouristId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    if (!touristId) return;
    setLoading(true);
    setResult(null);
    const res = await verifyId(touristId);
    if (res.ok) setResult(res.data);
    else setResult({ verified: false, message: 'Verification failed.' });
    setLoading(false);
  }

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
      <Text style={[tw`text-base font-semibold`, { color: dark ? '#fff' : '#000' }]}>
        Tamper-Proof ID Verification
      </Text>

      <View style={tw`mt-4 flex-row gap-2`}>
        <TextInput
          value={touristId}
          onChangeText={setTouristId}
          placeholder="TID-2026-ABCDE"
          placeholderTextColor={dark ? '#71717a' : '#a1a1aa'}
          autoCapitalize="characters"
          style={[
            tw`flex-1 rounded-xl px-4 py-3 text-sm`,
            {
              backgroundColor: dark ? '#000' : '#fff',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: dark ? '#ededed' : '#18181b',
              fontFamily: 'monospace',
            },
          ]}
        />
        <TouchableOpacity
          onPress={verify}
          disabled={!touristId || loading}
          style={[
            tw`rounded-xl px-5 justify-center`,
            {
              backgroundColor: dark ? '#fff' : '#000',
              opacity: !touristId || loading ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[tw`text-sm font-bold`, { color: dark ? '#000' : '#fff' }]}>
            {loading ? '...' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={tw`mt-4 gap-2`}>
          <View style={tw`flex-row flex-wrap gap-2`}>
            <StatusBadge value={result.verified ? 'verified' : 'critical'} />
            <StatusBadge value={result.validForTrip ? 'active' : 'expired'} />
          </View>
          <Text style={[tw`text-sm`, { color: dark ? '#a1a1aa' : '#52525b' }]}>
            {result.message}
          </Text>
          {result.storedHash && (
            <Text style={[tw`text-xs`, { color: '#71717a', fontFamily: 'monospace' }]}>
              SHA-256: {result.storedHash}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
