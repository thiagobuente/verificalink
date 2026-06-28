import { EventEmitter } from "events";

export type SOCEventType = "IOC_EVENT" | "INCIDENT_CREATED" | "CORRELATION_UPDATED" | "ACTION_EXECUTED" | "EVOLUTION_ADJUSTED" | "ALERT_TRIGGERED";

export interface SOCEvent<T = unknown> {
  id: string;
  type: SOCEventType;
  tenantId: string;
  timestamp: number;
  payload: T;
}

const bus = new EventEmitter();
const events: SOCEvent[] = [];

function id(type: SOCEventType, tenantId: string): string {
  return [tenantId, type, Date.now(), Math.random().toString(16).slice(2)].join(":");
}

export function publishSOCBusEvent<T>(type: SOCEventType, tenantId: string, payload: T): SOCEvent<T> {
  const event = { id: id(type, tenantId), type, tenantId, timestamp: Date.now(), payload };
  events.push(event);
  if (events.length > 1000) events.shift();
  bus.emit(type, event);
  bus.emit("*");
  return event;
}

export function subscribeSOCBus(type: SOCEventType | "*", listener: (event?: SOCEvent) => void): () => void {
  bus.on(type, listener);
  return () => bus.off(type, listener);
}

export function listSOCBusEvents(tenantId: string, limit = 100): SOCEvent[] {
  return events.filter((event) => event.tenantId === tenantId).slice(-limit).reverse();
}
