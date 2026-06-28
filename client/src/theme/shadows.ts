export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.24)",
  md: "0 12px 30px rgba(0, 0, 0, 0.28)",
  lg: "0 24px 80px rgba(0, 0, 0, 0.38)",
  glowCyan: "0 0 0 1px rgba(34, 211, 238, 0.14), 0 18px 50px rgba(34, 211, 238, 0.08)",
  glowDanger: "0 0 0 1px rgba(251, 113, 133, 0.18), 0 18px 50px rgba(251, 113, 133, 0.08)",
} as const;

export type ThemeShadows = typeof shadows;
