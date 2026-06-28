import type { AutonomousActionRecord } from "./autonomousModels";

export function rollbackAction(record: AutonomousActionRecord): AutonomousActionRecord {
  if (!record.reversible || /block/i.test(record.actionType)) return { ...record, status: "blocked" };
  return { ...record, status: "rolled_back" };
}
