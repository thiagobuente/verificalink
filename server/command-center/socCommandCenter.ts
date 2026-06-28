import { buildSOCOperationalView } from "./socOperationalAggregator";

export class SOCCommandCenter {
  feed(tenantId: string) {
    return buildSOCOperationalView(tenantId);
  }
}

export const socCommandCenter = new SOCCommandCenter();
