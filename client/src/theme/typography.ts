export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Sora', 'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export type ThemeTypography = typeof typography;
