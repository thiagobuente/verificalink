import { socAutonomousEngine, type AutonomousDecisionInput } from "../core/socAutonomousEngine";
import { socAutoRemediationEngine } from "../remediation/socAutoRemediationEngine";
import { socAutoEscalationEngine } from "../escalation/socAutoEscalationEngine";
import { socThreatContainmentEngine } from "../containment/socThreatContainmentEngine";

export class SOCAutoResponsePipeline {
  run(input: AutonomousDecisionInput & { summary?: string; iocs?: string[] }) {
    const decision = socAutonomousEngine.evaluate(input);
    const remediation = socAutoRemediationEngine.plan(input);
    const escalation = socAutoEscalationEngine.evaluate({ incidentId: input.incidentId, severity: input.severity, confidence: input.confidence, summary: input.summary, reasoning: input.rationale });
    const containment = socThreatContainmentEngine.recommend({ incidentId: input.incidentId, iocs: input.iocs, severity: input.severity });
    return { incidentId: input.incidentId, stage: "analyze-decide-validate-execute-log", decision, remediation, escalation, containment };
  }
}

export const socAutoResponsePipeline = new SOCAutoResponsePipeline();
