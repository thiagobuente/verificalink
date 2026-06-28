import { buildAutoTicketPayload } from "../../global/autonomous/autoTicketEngine";

export class SOCAutoEscalationEngine {
  evaluate(input: { incidentId: string; severity?: string; confidence?: number; summary?: string; reasoning?: string[] }) {
    const shouldEscalate = input.severity === "critical" || input.severity === "high" || (input.confidence ?? 0) >= 75;
    return {
      escalated: shouldEscalate,
      notify: shouldEscalate ? ["soc_operator"] : [],
      ticket: shouldEscalate ? buildAutoTicketPayload({ incidentId: input.incidentId, summary: input.summary, reasoning: input.reasoning, recommendedActions: ["Review incident", "Validate provider evidence"] }) : undefined,
    };
  }
}

export const socAutoEscalationEngine = new SOCAutoEscalationEngine();
