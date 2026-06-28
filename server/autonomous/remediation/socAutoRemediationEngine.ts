export type RemediationType = "block_ip" | "rate_limit" | "alert_escalation" | "quarantine_recommendation";

export interface RemediationPlan {
  incidentId: string;
  type: RemediationType;
  simulated: boolean;
  requiresApproval: boolean;
  steps: string[];
}

export class SOCAutoRemediationEngine {
  plan(input: { incidentId: string; actionType: string; confidence: number }): RemediationPlan[] {
    if (/block/i.test(input.actionType)) return [{ incidentId: input.incidentId, type: "block_ip", simulated: true, requiresApproval: true, steps: ["Prepare block request", "Require admin approval", "Do not execute automatically"] }];
    if (/rate_limit/i.test(input.actionType)) return [{ incidentId: input.incidentId, type: "rate_limit", simulated: true, requiresApproval: input.confidence <= 85, steps: ["Prepare rate limit recommendation", "Validate affected services"] }];
    if (/escalate/i.test(input.actionType)) return [{ incidentId: input.incidentId, type: "alert_escalation", simulated: true, requiresApproval: false, steps: ["Notify SOC operator", "Attach incident evidence"] }];
    return [{ incidentId: input.incidentId, type: "quarantine_recommendation", simulated: true, requiresApproval: true, steps: ["Recommend containment review", "Await analyst decision"] }];
  }
}

export const socAutoRemediationEngine = new SOCAutoRemediationEngine();
