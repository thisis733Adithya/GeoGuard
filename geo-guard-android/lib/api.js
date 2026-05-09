// API client for Geo Guard Android
// Change this to your web server's address:
// - Android Emulator: http://10.0.2.2:3000
// - Physical device on same WiFi: http://<YOUR_PC_IP>:3000
const API_BASE = 'http://10.0.2.2:3000';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error(`API Error [${path}]:`, err.message);
    return { ok: false, status: 0, data: { error: err.message } };
  }
}

export function registerTourist(form) {
  return request('/api/register-tourist', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export function fetchTourist(touristId) {
  return request(`/api/tourists?touristId=${encodeURIComponent(touristId)}`);
}

export function fetchAllTourists() {
  return request('/api/tourists');
}

export function updateConsent(touristId, trackingConsent) {
  return request('/api/tourists', {
    method: 'PATCH',
    body: JSON.stringify({ touristId, trackingConsent }),
  });
}

export function updateLocation(touristId, latitude, longitude) {
  return request('/api/update-location', {
    method: 'POST',
    body: JSON.stringify({ touristId, latitude, longitude }),
  });
}

export function fetchAlerts() {
  return request('/api/alerts');
}

export function fetchRiskZones() {
  return request('/api/risk-zones');
}

export function createTestZone(latitude, longitude) {
  return request('/api/risk-zones/create', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
}

export function triggerPanicAlert(touristId, latitude, longitude) {
  return request('/api/panic-alert', {
    method: 'POST',
    body: JSON.stringify({ touristId, latitude, longitude }),
  });
}

export function verifyId(touristId) {
  return request('/api/verify-id', {
    method: 'POST',
    body: JSON.stringify({ touristId }),
  });
}

export function fetchWeather(lat, lng) {
  return request(`/api/weather?lat=${lat}&lng=${lng}`);
}

export function fetchNearbyPlaces(lat, lng, type) {
  return request(`/api/nearby-places?lat=${lat}&lng=${lng}&type=${type}`);
}

export function loginAdmin(username, password) {
  return request('/api/auth/callback/credentials', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export { API_BASE };
