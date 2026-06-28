import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ShieldThemeMode = "dark" | "midnight" | "cyber" | "blue";

interface ShieldThemeContextValue {
  mode: ShieldThemeMode;
  setMode: (mode: ShieldThemeMode) => void;
}

const STORAGE_KEY = "shield-theme-mode";
const ShieldThemeContext = createContext<ShieldThemeContextValue | null>(null);

export function ShieldThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ShieldThemeMode>(() => {
    if (typeof window === "undefined") return "midnight";
    return (window.localStorage.getItem(STORAGE_KEY) as ShieldThemeMode | null) ?? "midnight";
  });

  useEffect(() => {
    document.documentElement.dataset.shieldTheme = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode: setModeState }), [mode]);
  return <ShieldThemeContext.Provider value={value}>{children}</ShieldThemeContext.Provider>;
}

export function useShieldTheme() {
  const context = useContext(ShieldThemeContext);
  if (!context) throw new Error("useShieldTheme must be used inside ShieldThemeProvider");
  return context;
}
