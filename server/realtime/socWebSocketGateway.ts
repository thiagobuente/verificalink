import type { Server } from "http";
import { listSOCBusEvents, publishSOCBusEvent, subscribeSOCBus, type SOCEvent } from "../events/socEventBus";

export type SOCRealtimeEventType = "incident.created" | "incident.updated" | "correlation.updated" | "alert.triggered" | "automation.executed";

const eventNameMap: Record<SOCRealtimeEventType, SOCEvent["type"]> = {
  "incident.created": "INCIDENT_CREATED",
  "incident.updated": "INCIDENT_CREATED",
  "correlation.updated": "CORRELATION_UPDATED",
  "alert.triggered": "ALERT_TRIGGERED",
  "automation.executed": "ACTION_EXECUTED",
};

export class SOCWebSocketGateway {
  private attached = false;

  attach(_server: Server): void {
    this.attached = true;
  }

  publish<T>(tenantId: string, type: SOCRealtimeEventType, payload: T): SOCEvent<T> {
    return publishSOCBusEvent(eventNameMap[type], tenantId, payload);
  }

  subscribe(listener: (event?: SOCEvent) => void): () => void {
    return subscribeSOCBus("*", listener);
  }

  list(tenantId: string, limit = 100): SOCEvent[] {
    return listSOCBusEvents(tenantId, limit);
  }

  status() {
    return { attached: this.attached, transport: "sse-compatible-event-bus" };
  }
}

export const socWebSocketGateway = new SOCWebSocketGateway();
