/**
 * Webhooks & Events Module
 * Implementa sistema de webhooks e eventos em tempo real
 */

// ============================================================================
// 1. EVENT EMITTER
// ============================================================================

export type EventType =
  | 'analysis.completed'
  | 'threat.detected'
  | 'domain.blacklisted'
  | 'reputation.changed'
  | 'rate_limit.exceeded'
  | 'api_key.rotated';

export interface Event {
  id: string;
  type: EventType;
  timestamp: number;
  data: any;
  userId?: string;
}

export interface EventListener {
  id: string;
  eventType: EventType;
  callback: (event: Event) => void | Promise<void>;
}

export class EventEmitter {
  private listeners: Map<EventType, EventListener[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;

  on(eventType: EventType, callback: (event: Event) => void | Promise<void>): string {
    const id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push({ id, eventType, callback });
    return id;
  }

  off(eventType: EventType, listenerId: string): boolean {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return false;

    const index = listeners.findIndex(l => l.id === listenerId);
    if (index === -1) return false;

    listeners.splice(index, 1);
    return true;
  }

  async emit(eventType: EventType, data: any, userId?: string): Promise<void> {
    const event: Event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: Date.now(),
      data,
      userId,
    };

    // Adicionar ao histórico
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Executar listeners
    const listeners = this.listeners.get(eventType) || [];
    await Promise.all(listeners.map(listener => listener.callback(event)));
  }

  getHistory(eventType?: EventType, limit: number = 100): Event[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter(e => e.type === eventType);
    }

    return history.slice(-limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}

// ============================================================================
// 2. WEBHOOK MANAGEMENT
// ============================================================================

export interface Webhook {
  id: string;
  url: string;
  events: EventType[];
  secret: string;
  isActive: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  failureCount: number;
  maxRetries: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  error?: string;
}

export class WebhookManager {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private retryQueue: WebhookDelivery[] = [];

  registerWebhook(url: string, events: EventType[], secret: string): Webhook {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhook: Webhook = {
      id,
      url,
      events,
      secret,
      isActive: true,
      createdAt: Date.now(),
      failureCount: 0,
      maxRetries: 5,
    };

    this.webhooks.set(id, webhook);
    return webhook;
  }

  updateWebhook(id: string, updates: Partial<Webhook>): Webhook | null {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    Object.assign(webhook, updates);
    return webhook;
  }

  deleteWebhook(id: string): boolean {
    return this.webhooks.delete(id);
  }

  getWebhooks(eventType?: EventType): Webhook[] {
    const webhooks = Array.from(this.webhooks.values());

    if (eventType) {
      return webhooks.filter(w => w.isActive && w.events.includes(eventType));
    }

    return webhooks.filter(w => w.isActive);
  }

  async triggerWebhooks(event: Event): Promise<void> {
    const webhooks = this.getWebhooks(event.type);

    for (const webhook of webhooks) {
      const delivery: WebhookDelivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        eventId: event.id,
        status: 'pending',
        attempts: 0,
      };

      this.deliveries.set(delivery.id, delivery);
      this.retryQueue.push(delivery);

      // Tentar entrega imediata
      await this.deliverWebhook(webhook, event, delivery);
    }
  }

  private async deliverWebhook(
    webhook: Webhook,
    event: Event,
    delivery: WebhookDelivery
  ): Promise<void> {
    delivery.attempts++;
    delivery.lastAttemptAt = Date.now();

    try {
      // Em produção, fazer requisição HTTP real
      // Aqui apenas simulamos
      const payload = JSON.stringify(event);
      const signature = this.generateSignature(payload, webhook.secret);

      // Simular sucesso/falha
      const success = Math.random() > 0.1; // 90% de sucesso

      if (success) {
        delivery.status = 'delivered';
        webhook.lastTriggeredAt = Date.now();
        webhook.failureCount = 0;
      } else {
        throw new Error('Simulated delivery failure');
      }
    } catch (error) {
      delivery.error = String(error);
      webhook.failureCount++;

      if (delivery.attempts < webhook.maxRetries) {
        delivery.status = 'pending';
        const backoffMs = Math.pow(2, delivery.attempts) * 1000; // Exponential backoff
        delivery.nextRetryAt = Date.now() + backoffMs;
      } else {
        delivery.status = 'failed';
        webhook.isActive = false; // Desativar webhook após muitas falhas
      }
    }
  }

  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  getDeliveryStatus(deliveryId: string): WebhookDelivery | null {
    return this.deliveries.get(deliveryId) || null;
  }

  getWebhookDeliveries(webhookId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values()).filter(d => d.webhookId === webhookId);
  }

  async processRetryQueue(): Promise<void> {
    const now = Date.now();
    const toRetry = this.retryQueue.filter(d => d.nextRetryAt && d.nextRetryAt <= now);

    for (const delivery of toRetry) {
      const webhook = this.webhooks.get(delivery.webhookId);
      if (!webhook) continue;

      // Reconstituir evento (em produção, seria recuperado do banco de dados)
      const event: Event = {
        id: delivery.eventId,
        type: 'analysis.completed',
        timestamp: Date.now(),
        data: {},
      };

      await this.deliverWebhook(webhook, event, delivery);
    }

    // Remover entregas concluídas ou falhadas da fila
    this.retryQueue = this.retryQueue.filter(
      d => d.status === 'pending' && d.nextRetryAt && d.nextRetryAt > now
    );
  }
}

// ============================================================================
// 3. REAL-TIME NOTIFICATIONS
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export class NotificationManager {
  private notifications: Map<string, Notification[]> = new Map();
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map();

  notify(userId: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    this.notifications.get(userId)!.push(fullNotification);

    // Notificar subscribers
    const subscribers = this.subscribers.get(userId) || new Set();
    subscribers.forEach(callback => callback(fullNotification));

    return fullNotification;
  }

  subscribe(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }

    this.subscribers.get(userId)!.add(callback);

    // Retornar função de unsubscribe
    return () => {
      this.subscribers.get(userId)?.delete(callback);
    };
  }

  getNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];

    if (unreadOnly) {
      return userNotifications.filter(n => !n.read);
    }

    return userNotifications;
  }

  markAsRead(userId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(userId);
    if (!notifications) return false;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    return true;
  }

  markAllAsRead(userId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    notifications.forEach(n => (n.read = true));
  }

  deleteNotification(userId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(userId);
    if (!notifications) return false;

    const index = notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return false;

    notifications.splice(index, 1);
    return true;
  }

  getUnreadCount(userId: string): number {
    const notifications = this.notifications.get(userId) || [];
    return notifications.filter(n => !n.read).length;
  }
}

// ============================================================================
// 4. EVENT AGGREGATION
// ============================================================================

export interface AggregatedEvents {
  period: {
    start: number;
    end: number;
  };
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  topUsers: Array<{ userId: string; count: number }>;
  trends: {
    threatsDetected: number;
    domainsBlacklisted: number;
    analysisCompleted: number;
  };
}

export class EventAggregator {
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  getAggregatedStats(periodMs: number = 86400000): AggregatedEvents {
    const now = Date.now();
    const startTime = now - periodMs;

    const events = this.eventEmitter.getHistory(undefined, 10000).filter(e => e.timestamp >= startTime);

    const eventsByType: Record<EventType, number> = {
      'analysis.completed': 0,
      'threat.detected': 0,
      'domain.blacklisted': 0,
      'reputation.changed': 0,
      'rate_limit.exceeded': 0,
      'api_key.rotated': 0,
    };

    const userCounts: Map<string, number> = new Map();

    for (const event of events) {
      eventsByType[event.type]++;

      if (event.userId) {
        userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
      }
    }

    const topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period: { start: startTime, end: now },
      totalEvents: events.length,
      eventsByType,
      topUsers,
      trends: {
        threatsDetected: eventsByType['threat.detected'],
        domainsBlacklisted: eventsByType['domain.blacklisted'],
        analysisCompleted: eventsByType['analysis.completed'],
      },
    };
  }
}
