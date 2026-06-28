import { EventEmitter } from 'events';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

interface WebhookEvent {
  type: 'domain.reputation_changed' | 'domain.blacklisted' | 'analysis.completed' | 'threat.detected';
  domain?: string;
  email?: string;
  data: any;
  timestamp: Date;
}

class WebhookManager extends EventEmitter {
  private webhooks = new Map<string, Webhook>();
  private eventHistory: WebhookEvent[] = [];
  private maxHistorySize = 1000;

  registerWebhook(url: string, events: string[]): Webhook {
    const webhook: Webhook = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      events,
      active: true,
      createdAt: new Date(),
      failureCount: 0,
    };

    this.webhooks.set(webhook.id, webhook);
    console.log(`✅ Webhook registered: ${webhook.id} for events: ${events.join(', ')}`);
    return webhook;
  }

  unregisterWebhook(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  async triggerEvent(event: WebhookEvent): Promise<void> {
    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit to matching webhooks
    for (const webhook of this.webhooks.values()) {
      if (!webhook.active) continue;
      if (!webhook.events.includes(event.type)) continue;

      this.deliverWebhook(webhook, event);
    }

    // Emit local event
    this.emit(event.type, event);
  }

  private async deliverWebhook(webhook: Webhook, event: WebhookEvent): Promise<void> {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': event.type,
          'X-Webhook-Timestamp': event.timestamp.toISOString(),
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        webhook.lastTriggeredAt = new Date();
        webhook.failureCount = 0;
        console.log(`✅ Webhook delivered: ${webhook.id}`);
      } else {
        webhook.failureCount++;
        console.warn(`⚠️ Webhook failed: ${webhook.id} (status: ${response.status})`);

        // Deactivate after 5 failures
        if (webhook.failureCount >= 5) {
          webhook.active = false;
          console.error(`❌ Webhook deactivated: ${webhook.id} (too many failures)`);
        }
      }
    } catch (error) {
      webhook.failureCount++;
      console.error(`❌ Webhook error: ${webhook.id}`, error);

      if (webhook.failureCount >= 5) {
        webhook.active = false;
      }
    }
  }

  getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  getEventHistory(limit: number = 100): WebhookEvent[] {
    return this.eventHistory.slice(-limit);
  }

  getWebhookStats() {
    const webhooks = Array.from(this.webhooks.values());
    return {
      total: webhooks.length,
      active: webhooks.filter(w => w.active).length,
      inactive: webhooks.filter(w => !w.active).length,
      historySize: this.eventHistory.length,
    };
  }
}

export const webhookManager = new WebhookManager();

// Predefined event types
export const webhookEvents = {
  DOMAIN_REPUTATION_CHANGED: 'domain.reputation_changed',
  DOMAIN_BLACKLISTED: 'domain.blacklisted',
  ANALYSIS_COMPLETED: 'analysis.completed',
  THREAT_DETECTED: 'threat.detected',
};

// Helper functions to trigger events
export async function notifyReputationChange(domain: string, oldScore: number, newScore: number, reason: string) {
  await webhookManager.triggerEvent({
    type: 'domain.reputation_changed',
    domain,
    data: {
      oldScore,
      newScore,
      change: newScore - oldScore,
      reason,
    },
    timestamp: new Date(),
  });
}

export async function notifyDomainBlacklisted(domain: string, source: string, reason: string) {
  await webhookManager.triggerEvent({
    type: 'domain.blacklisted',
    domain,
    data: {
      source,
      reason,
      detectedAt: new Date().toISOString(),
    },
    timestamp: new Date(),
  });
}

export async function notifyAnalysisCompleted(email: string, score: number, threats: string[]) {
  await webhookManager.triggerEvent({
    type: 'analysis.completed',
    email,
    data: {
      score,
      threats,
      completedAt: new Date().toISOString(),
    },
    timestamp: new Date(),
  });
}

export async function notifyThreatDetected(domain: string, threatType: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) {
  await webhookManager.triggerEvent({
    type: 'threat.detected',
    domain,
    data: {
      threatType,
      severity,
      details,
      detectedAt: new Date().toISOString(),
    },
    timestamp: new Date(),
  });
}
