export class SOCThreatContainmentEngine {
  recommend(input: { incidentId: string; iocs?: string[]; severity?: string }) {
    const sensitive = input.severity === "critical" || input.severity === "high";
    return {
      incidentId: input.incidentId,
      recommendations: ["isolate IOC for analyst review", "reduce exposed service surface", ...(sensitive ? ["prepare block pattern request"] : ["continue monitoring related patterns"])],
      executable: false,
      reason: "Containment engine only prepares recommendations; it never changes infrastructure directly.",
    };
  }
}

export const socThreatContainmentEngine = new SOCThreatContainmentEngine();
