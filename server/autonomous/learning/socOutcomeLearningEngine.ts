export interface SOCLearningSignal {
  incidentId: string;
  outcome: "true_positive" | "false_positive" | "benign" | "unknown";
  confidenceDelta: number;
}

const signals: SOCLearningSignal[] = [];

export class SOCOutcomeLearningEngine {
  record(signal: SOCLearningSignal): void {
    signals.push(signal);
    if (signals.length > 500) signals.shift();
  }

  summarize() {
    return { total: signals.length, recent: signals.slice(-20), recommendation: signals.some((signal) => signal.outcome === "false_positive") ? "review alert sensitivity" : "maintain current thresholds" };
  }
}

export const socOutcomeLearningEngine = new SOCOutcomeLearningEngine();
