export interface SOARWorkflowRule {
  id: string;
  attackType: string;
  minCorrelationScore: number;
  actions: string[];
}

const workflows: SOARWorkflowRule[] = [
  { id: "scanning-workflow", attackType: "scanning", minCorrelationScore: 50, actions: ["monitor", "ticket"] },
  { id: "malware-workflow", attackType: "malware", minCorrelationScore: 70, actions: ["alert", "ticket", "block_request"] },
  { id: "exposure-workflow", attackType: "exposure", minCorrelationScore: 60, actions: ["ticket", "rate_limit"] },
];

export class SOCSOARWorkflowEngine {
  select(input: { attackType?: string; correlationScore?: number }) {
    return workflows.find((workflow) => (input.attackType ?? "").includes(workflow.attackType) && (input.correlationScore ?? 0) >= workflow.minCorrelationScore) ?? workflows[0];
  }

  list() {
    return workflows;
  }
}

export const socSOARWorkflowEngine = new SOCSOARWorkflowEngine();
