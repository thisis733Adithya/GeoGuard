import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import tw from '../lib/tw';
import { useTheme } from '../lib/theme';
import { fetchNearbyPlaces } from '../lib/api';

const PRICE = ['', '₹', '₹₹', '₹₹₹', '₹₹₹₹'];

function StarRating({ rating }) {
  if (!rating) return <Text style={[tw`text-xs`, { color: '#a1a1aa' }]}>No rating</Text>;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={tw`flex-row items-center gap-1`}>
      <Text style={[tw`text-sm`, { color: '#facc15' }]}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(5 - full - (half ? 1 : 0))}
      </Text>
      <Text style={[tw`text-xs`, { color: '#a1a1aa' }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function PlaceCard({ place, dark }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
  const bg = dark ? '#000' : '#fff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const heading = dark ? '#fff' : '#000';
  const muted = dark ? '#a1a1aa' : '#52525b';

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(mapsUrl)}
      style={[tw`rounded-xl p-4 gap-1.5`, { backgroundColor: bg, borderWidth: 1, borderColor: border }]}
    >
      <View style={tw`flex-row items-start justify-between gap-2`}>
        <Text style={[tw`text-sm font-semibold flex-1`, { color: heading }]}>{place.name}</Text>
        {place.priceLevel ? (
          <Text style={[tw`text-xs font-medium`, { color: '#10b981' }]}>{PRICE[place.priceLevel]}</Text>
        ) : null}
      </View>
      <StarRating rating={place.rating} />
      {place.address ? (
        <Text style={[tw`text-xs leading-relaxed`, { color: muted }]}>{place.address}</Text>
      ) : null}
      <View style={tw`flex-row items-center justify-between gap-2 mt-1`}>
        {place.open !== null && place.open !== undefined ? (
          <Text style={[tw`text-xs font-semibold`, { color: place.open ? '#10b981' : '#f31260' }]}>
            {place.open ? 'Open Now' : 'Closed'}
          </Text>
        ) : <View />}
        <Text style={[tw`text-xs font-medium`, { color: dark ? '#fff' : '#000' }]}>View on Maps →</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NearbyPlaces({ location }) {
  const { dark } = useTheme();
  const [tab, setTab] = useState('restaurant');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const heading = dark ? '#fff' : '#000';
  const muted = dark ? '#a1a1aa' : '#52525b';

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    setLoading(true);
    setError('');
    fetchNearbyPlaces(location.latitude, location.longitude, tab)
      .then((res) => {
        setPlaces(res.data?.places || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load nearby places.');
        setLoading(false);
      });
  }, [location?.latitude, location?.longitude, tab]);

  if (!location) {
    return (
      <View style={[tw`rounded-2xl p-6`, { backgroundColor: bg, borderWidth: 1, borderColor: border }]}>
        <Text style={[tw`text-lg font-semibold`, { color: heading }]}>Nearby Places</Text>
        <Text style={[tw`mt-3 text-sm`, { color: muted }]}>Share your live location to see nearby hotels and restaurants.</Text>
      </View>
    );
  }

  const tabs = [
    { id: 'restaurant', label: '🍽️ Food' },
    { id: 'lodging', label: '🏨 Stay' },
  ];

  return (
    <View style={[tw`rounded-2xl p-5`, { backgroundColor: bg, borderWidth: 1, borderColor: border }]}>
      <View style={tw`flex-row flex-wrap items-center justify-between gap-3`}>
        <View>
          <Text style={[tw`text-lg font-semibold`, { color: heading }]}>Nearby Places</Text>
          <Text style={[tw`text-xs`, { color: muted }]}>Trusted spots within 1.5 km</Text>
        </View>
        <View
          style={[
            tw`flex-row gap-1 rounded-xl p-1`,
            { backgroundColor: dark ? '#000' : '#fff', borderWidth: 1, borderColor: border },
          ]}
        >
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                tw`rounded-lg px-3 py-1.5`,
                tab === t.id && { backgroundColor: dark ? '#fff' : '#000' },
              ]}
            >
              <Text
                style={[
                  tw`text-xs font-semibold`,
                  { color: tab === t.id ? (dark ? '#000' : '#fff') : muted },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={tw`mt-4`}>
        {loading ? (
          <View style={tw`flex-row items-center gap-2`}>
            <ActivityIndicator size="small" color={heading} />
            <Text style={[tw`text-sm`, { color: muted }]}>Searching nearby…</Text>
          </View>
        ) : error ? (
          <Text style={[tw`text-sm`, { color: '#f31260' }]}>{error}</Text>
        ) : places.length === 0 ? (
          <Text style={[tw`text-sm`, { color: muted }]}>
            No {tab === 'lodging' ? 'hotels' : 'restaurants'} found nearby.
          </Text>
        ) : (
          <View style={tw`gap-3`}>
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} dark={dark} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
