export interface SOCExplanationInput {
  incident?: { title?: string; severity?: string; confidence?: number };
  scoring?: { threatScore?: number; explanation?: string[] };
  action?: { actionType?: string; rationale?: string[] };
}

export class SOCAIExplainEngine {
  explain(input: SOCExplanationInput) {
    return {
      whyIncidentHappened: input.incident?.title ? "Incident was created because correlated evidence matched: " + input.incident.title : "Incident was created from available IOC evidence.",
      whyScoreAssigned: input.scoring?.explanation?.length ? input.scoring.explanation : ["Score reflects normalized provider confidence and correlation context."],
      whyActionSuggested: input.action?.rationale?.length ? input.action.rationale : ["Action was suggested from SOC decision thresholds and current risk context."],
    };
  }
}

export const socAIExplainEngine = new SOCAIExplainEngine();
