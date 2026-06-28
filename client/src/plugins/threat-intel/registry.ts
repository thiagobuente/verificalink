import { createMockThreatIntelPlugin } from "./mockPluginFactory";
import type { ThreatIntelPlugin } from "./types";

export const threatIntelPlugins: ThreatIntelPlugin[] = [
  createMockThreatIntelPlugin("virustotal", "VirusTotal", "Google Chronicle"),
  createMockThreatIntelPlugin("shodan", "Shodan", "Shodan"),
  createMockThreatIntelPlugin("greynoise", "GreyNoise", "GreyNoise"),
  createMockThreatIntelPlugin("abuseipdb", "AbuseIPDB", "AbuseIPDB"),
  createMockThreatIntelPlugin("alienvault", "AlienVault OTX", "LevelBlue"),
  createMockThreatIntelPlugin("censys", "Censys", "Censys"),
];

export function getEnabledThreatIntelPlugins() {
  return threatIntelPlugins.filter((plugin) => plugin.enabled);
}
