export function buildAutoTicketPayload(input: { incidentId: string; summary?: string; reasoning?: string[]; recommendedActions?: string[] }) {
  return {
    title: "SOC Review: " + input.incidentId,
    description: input.summary ?? "Automated SOC ticket generated for analyst review",
    incidentId: input.incidentId,
    reasoning: input.reasoning ?? [],
    recommendedActions: input.recommendedActions ?? [],
    status: "open",
    source: "shield-security-autonomous-safe",
  };
}
