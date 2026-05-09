import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tw';
import { useTheme } from '../lib/theme';
import { registerTourist } from '../lib/api';
import { setTouristId } from '../lib/storage';

const initialForm = {
  fullName: '',
  governmentId: '',
  phone: '',
  emergencyContact: '',
  tripStartDate: '',
  tripEndDate: '',
  plannedItinerary: '',
  trackingConsent: true,
};

export default function RegisterScreen() {
  const { dark } = useTheme();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bg = dark ? '#000000' : '#ffffff';
  const heading = dark ? '#ffffff' : '#000000';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const brand = dark ? '#ffffff' : '#000000';
  const brandText = dark ? '#000000' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const surface = dark ? '#111111' : '#ffffff';
  const inputBg = dark ? '#000' : '#fff';
  const textC = dark ? '#ededed' : '#18181b';

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function submit() {
    setLoading(true);
    setError('');
    setCreated(null);
    const res = await registerTourist(form);
    if (res.ok) {
      await setTouristId(res.data.touristId);
      setCreated(res.data.tourist);
      setForm(initialForm);
    } else {
      setError(res.data?.error || 'Registration failed.');
    }
    setLoading(false);
  }

  function renderInput(label, field, opts = {}) {
    return (
      <View style={tw`gap-1.5`}>
        <Text style={[tw`text-sm font-medium`, { color: heading }]}>{label}</Text>
        {opts.multiline ? (
          <TextInput
            value={form[field]}
            onChangeText={(v) => updateField(field, v)}
            placeholder={opts.placeholder}
            placeholderTextColor={dark ? '#71717a' : '#a1a1aa'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[
              tw`rounded-lg px-3 py-2 text-sm`,
              {
                backgroundColor: inputBg, borderWidth: 1, borderColor: border, color: textC,
                minHeight: 80,
              },
            ]}
          />
        ) : (
          <TextInput
            value={form[field]}
            onChangeText={(v) => updateField(field, v)}
            placeholder={opts.placeholder}
            placeholderTextColor={dark ? '#71717a' : '#a1a1aa'}
            keyboardType={opts.keyboardType || 'default'}
            autoCapitalize={opts.autoCapitalize || 'sentences'}
            style={[
              tw`rounded-lg px-3 py-2 text-sm`,
              {
                backgroundColor: inputBg, borderWidth: 1, borderColor: border, color: textC,
                minHeight: 44,
              },
            ]}
          />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={tw`px-4 pb-8`}>
        {/* Close */}
        <TouchableOpacity onPress={() => router.back()} style={tw`py-3 self-end`}>
          <Text style={[tw`text-sm font-semibold`, { color: muted }]}>✕ Close</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={tw`items-center py-4 gap-2`}>
          <Text style={[tw`text-2xl font-bold text-center`, { color: heading }]}>Tourist Registration</Text>
          <Text style={[tw`text-sm text-center`, { color: muted }]}>
            Register to get your digital tourist safety ID.
          </Text>
        </View>

        {/* Form */}
        <View
          style={[
            tw`rounded-2xl p-5 gap-4`,
            { backgroundColor: surface, borderWidth: 1, borderColor: border },
          ]}
        >
          {renderInput('Full name', 'fullName')}
          {renderInput('Aadhaar / Passport number', 'governmentId')}
          {renderInput('Phone number', 'phone', { keyboardType: 'phone-pad' })}
          {renderInput('Emergency contact', 'emergencyContact', { keyboardType: 'phone-pad' })}
          {renderInput('Trip start date', 'tripStartDate', { placeholder: 'YYYY-MM-DD' })}
          {renderInput('Trip end date', 'tripEndDate', { placeholder: 'YYYY-MM-DD' })}
          {renderInput('Planned itinerary', 'plannedItinerary', {
            multiline: true,
            placeholder: 'Red Fort, India Gate, museum visit, hotel area',
          })}

          {/* Consent */}
          <View
            style={[
              tw`flex-row items-center justify-between rounded-xl p-4`,
              { backgroundColor: inputBg, borderWidth: 1, borderColor: border },
            ]}
          >
            <Text style={[tw`text-sm font-medium flex-1 mr-3`, { color: textC }]}>
              I consent to trip-duration safety tracking.
            </Text>
            <Switch
              value={form.trackingConsent}
              onValueChange={(v) => updateField('trackingConsent', v)}
              trackColor={{ false: '#71717a', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>

          {error ? (
            <View style={[tw`rounded-xl p-3`, { backgroundColor: '#f31260' }]}>
              <Text style={[tw`text-sm font-medium`, { color: '#fff' }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[
              tw`rounded-xl py-4 items-center mt-2`,
              { backgroundColor: brand, opacity: loading ? 0.6 : 1 },
            ]}
          >
            <Text style={[tw`text-base font-bold`, { color: brandText }]}>
              {loading ? 'Generating ID…' : 'Register & Generate Tourist ID'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Result card */}
        {created && (
          <View
            style={[
              tw`rounded-2xl p-5 mt-5 gap-4`,
              { backgroundColor: surface, borderWidth: 1, borderColor: border },
            ]}
          >
            <Text style={[tw`text-lg font-semibold`, { color: heading }]}>Digital Tourist ID</Text>
            <View
              style={[
                tw`rounded-xl p-4`,
                { backgroundColor: dark ? '#1a1a1a' : '#fafafa', borderWidth: 1, borderColor: border },
              ]}
            >
              <Text style={[tw`text-xs uppercase tracking-widest`, { color: muted }]}>Temporary ID</Text>
              <Text style={[tw`mt-2 text-xl font-black`, { color: heading, fontFamily: 'monospace' }]}>
                {created.touristId}
              </Text>
            </View>
            <Text style={[tw`text-sm`, { color: muted }]}>
              Valid from {created.tripStartDate} to {created.tripEndDate}. Integrity hash stored with SHA-256.
            </Text>
            <Text style={[tw`text-xs p-3 rounded-lg`, { color: muted, fontFamily: 'monospace', backgroundColor: inputBg, borderWidth: 1, borderColor: border }]}>
              {created.idHash}
            </Text>
            <TouchableOpacity
              onPress={() => {
                router.back();
                setTimeout(() => router.push('/(tabs)/tourist'), 100);
              }}
              style={[
                tw`rounded-xl py-3.5 items-center`,
                { backgroundColor: surface, borderWidth: 1, borderColor: border },
              ]}
            >
              <Text style={[tw`text-sm font-bold`, { color: heading }]}>Open Tourist Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
