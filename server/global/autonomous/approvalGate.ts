export function requiresHumanApproval(actionType: string, confidence: number): boolean {
  if (/block|critical|firewall|shutdown/i.test(actionType)) return true;
  if (/rate_limit/i.test(actionType)) return confidence <= 85;
  if (/investigate|ticket/i.test(actionType)) return true;
  return false;
}
