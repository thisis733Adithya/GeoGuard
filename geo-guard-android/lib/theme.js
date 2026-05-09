import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTheme, setTheme as persistTheme } from './storage';

const ThemeContext = createContext({
  dark: true,
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    getTheme().then((t) => setDark(t === 'dark'));
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      persistTheme(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
