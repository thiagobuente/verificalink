import { cloudIngestion } from "../cloud/cloudIngestion";
import { ssoProvider } from "../auth/ssoProvider";
import type { SIEMConnector } from "./siemConnector";
import { SentinelAdapter } from "./sentinelAdapter";
import { SplunkAdapter } from "./splunkAdapter";

const siemConnectors = new Map<string, SIEMConnector>();

export function registerSIEMConnector(connector: SIEMConnector): void {
  siemConnectors.set(connector.id, connector);
}

export function getSIEMConnectors(): SIEMConnector[] {
  return [...siemConnectors.values()];
}

export function getSIEMConnector(id: string): SIEMConnector | undefined {
  return siemConnectors.get(id);
}

export function enterpriseConnectorRegistry() {
  return {
    siemConnectors: getSIEMConnectors().map((connector) => ({ id: connector.id, name: connector.name })),
    cloudConnectors: ["aws-cloudwatch", "azure-monitor", "gcp-security-command-center"],
    identityProviders: ["oidc", "saml", "api_key"],
  };
}

registerSIEMConnector(new SentinelAdapter({ enabled: false }));
registerSIEMConnector(new SplunkAdapter({ enabled: false }));

export { cloudIngestion, ssoProvider };
