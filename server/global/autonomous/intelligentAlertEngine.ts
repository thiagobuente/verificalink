const alertCooldown = new Map<string, number>();
const cooldownMs = 10 * 60 * 1000;

export function shouldEmitAlert(key: string): boolean {
  const now = Date.now();
  if ((alertCooldown.get(key) ?? 0) + cooldownMs > now) return false;
  alertCooldown.set(key, now);
  return true;
}
