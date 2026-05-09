import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOURIST_ID: 'geoGuardTouristId',
  THEME: 'geoGuardTheme',
  ADMIN_SESSION: 'geoGuardAdminSession',
};

export async function getTouristId() {
  try {
    return await AsyncStorage.getItem(KEYS.TOURIST_ID);
  } catch {
    return null;
  }
}

export async function setTouristId(id) {
  try {
    await AsyncStorage.setItem(KEYS.TOURIST_ID, id);
  } catch {}
}

export async function getTheme() {
  try {
    return (await AsyncStorage.getItem(KEYS.THEME)) || 'dark';
  } catch {
    return 'dark';
  }
}

export async function setTheme(theme) {
  try {
    await AsyncStorage.setItem(KEYS.THEME, theme);
  } catch {}
}

export async function getAdminSession() {
  try {
    const json = await AsyncStorage.getItem(KEYS.ADMIN_SESSION);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function setAdminSession(session) {
  try {
    await AsyncStorage.setItem(KEYS.ADMIN_SESSION, JSON.stringify(session));
  } catch {}
}

export async function clearAdminSession() {
  try {
    await AsyncStorage.removeItem(KEYS.ADMIN_SESSION);
  } catch {}
}
