import type { ThreatIntelProvider } from "./interfaces/provider";
import { VirusTotalProvider } from "./VirusTotalProvider";
import { AbuseIPDBProvider } from "./AbuseIPDBProvider";
import { AlienVaultOTXProvider } from "./AlienVaultOTXProvider";
import { URLScanProvider } from "./URLScanProvider";
import { GreyNoiseProvider } from "./GreyNoiseProvider";
import { ShodanProvider } from "./ShodanProvider";
import { CensysProvider } from "./CensysProvider";
import { PhishingHeuristicsProvider } from "./PhishingHeuristicsProvider";

const providers: ThreatIntelProvider[] = [
  new VirusTotalProvider(),
  new AbuseIPDBProvider(),
  new AlienVaultOTXProvider(),
  new URLScanProvider(),
  new GreyNoiseProvider(),
  new ShodanProvider(),
  new CensysProvider(),
  new PhishingHeuristicsProvider(),
];

export function getThreatIntelProviders(): ThreatIntelProvider[] {
  return providers;
}
