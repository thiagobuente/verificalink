import type { SOCEvolutionPoint, SOCResilienceScore } from "./simulationModels";

const points: SOCEvolutionPoint[] = [];

export class SOCEvolutionTracker {
  record(resilienceScore: SOCResilienceScore, scenarioCount: number): SOCEvolutionPoint {
    const point = { timestamp: Date.now(), resilienceScore, scenarioCount };
    points.push(point);
    if (points.length > 200) points.shift();
    return point;
  }

  list(): SOCEvolutionPoint[] {
    return [...points].sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const socEvolutionTracker = new SOCEvolutionTracker();
