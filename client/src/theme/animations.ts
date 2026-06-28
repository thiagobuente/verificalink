export const animations = {
  duration: {
    fast: "140ms",
    base: "220ms",
    slow: "360ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type ThemeAnimations = typeof animations;
