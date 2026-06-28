export const colors = {
  background: {
    app: "#070b14",
    surface: "#0d1424",
    surfaceElevated: "#111a2d",
    surfaceMuted: "#172235",
    overlay: "rgba(7, 11, 20, 0.72)",
  },
  border: {
    subtle: "rgba(148, 163, 184, 0.14)",
    strong: "rgba(148, 163, 184, 0.28)",
    focus: "rgba(34, 211, 238, 0.56)",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    muted: "#94a3b8",
    inverse: "#06111f",
  },
  accent: {
    cyan: "#22d3ee",
    blue: "#60a5fa",
    violet: "#a78bfa",
    emerald: "#34d399",
    amber: "#fbbf24",
    rose: "#fb7185",
    red: "#f87171",
  },
  risk: {
    safe: "#34d399",
    warning: "#fbbf24",
    danger: "#fb7185",
    neutral: "#94a3b8",
  },
} as const;

export type ThemeColors = typeof colors;
