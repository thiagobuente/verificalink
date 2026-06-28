export type ChaosScenario = "provider_failure" | "latency_spike" | "corrupted_ioc" | "partial_outage";
export function simulateSOCChaos(scenario: ChaosScenario) { return { scenario, timestamp: Date.now(), simulated: true, expectedBehavior: "SOC should return degraded safe response without crashing" }; }
