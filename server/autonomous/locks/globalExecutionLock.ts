const active = new Set<string>();
const queues = new Map<string, Array<() => void>>();

export class GlobalExecutionLock {
  async runExclusive<T>(incidentId: string, task: () => Promise<T>): Promise<T> {
    if (active.has(incidentId)) {
      await new Promise<void>((resolve) => {
        const queue = queues.get(incidentId) ?? [];
        queue.push(resolve);
        queues.set(incidentId, queue);
      });
    }
    active.add(incidentId);
    try {
      return await task();
    } finally {
      active.delete(incidentId);
      const queue = queues.get(incidentId) ?? [];
      const next = queue.shift();
      if (queue.length === 0) queues.delete(incidentId);
      else queues.set(incidentId, queue);
      if (next) next();
    }
  }

  status() {
    return { active: [...active], queued: [...queues.entries()].map(([incidentId, queue]) => ({ incidentId, size: queue.length })) };
  }
}

export const globalExecutionLock = new GlobalExecutionLock();
