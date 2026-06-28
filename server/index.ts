import { randomBytes } from "crypto";
import { readFile } from "fs/promises";
import cors from "cors";
import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { getMetrics } from "./observability/metrics";
import { errorHandler, requestLogger } from "./observability/requestMiddleware";
import { logger } from "./observability/logger";
import { trpcMiddleware } from "./trpcMiddleware";
import { apiGateway } from "./platform/gateway/apiGateway";
import { currentTenantId, getTenantContext } from "./platform/tenant/tenantContext";
import { getTenantFeatureFlags } from "./platform/saas/featureFlags";
import { getTenantUsage } from "./platform/saas/tenantProvisioning";
import { threatNetwork, getThreatSharingSettings, setThreatSharingSettings, defenseCoordinator, getTenantDefensePosture, setTenantDefensePosture, socWarGameEngine, limitedResponseEngine, socEvolutionEngine } from "./global";
import { iocAggregator, incidentStore, socTimelineBuilder, getSOCMetrics, incidentReplayEngine } from "./providers";
import { socCommandCenter } from "./command-center/socCommandCenter";
import { attachSSE } from "./command-center/socEventStream";
import { runSOCStabilizer } from "./audit/system/socStabilizer";
import { socGateway } from "./api/socGateway";
import { socTimelineEngine } from "./command-center/timeline/socTimelineEngine";
import { listAlerts } from "./observability/alertFatigueController";
import { socWebSocketGateway } from "./realtime/socWebSocketGateway";
import { getFailsafeMode, globalExecutionLock, socSafeRemediationEngine, socSelfHealingEngine } from "./autonomous";
import { manusEventSync } from "./cloud/manus/manusEventSync";
import { manusIdempotencyKeyManager } from "./cloud/manus/manusIdempotencyKeyManager";
import { manusReconciliationEngine } from "./cloud/manus/manusReconciliationEngine";
import { getRemediationMetrics } from "./observability/remediationMetrics";
import type { IocType } from "./providers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const configuredScriptSources = (process.env.CSP_SCRIPT_SRC || "")
  .split(",")
  .map((source) => source.trim())
  .filter(Boolean);
const iocTypes = new Set<IocType>(["ip", "domain", "url", "hash", "email", "unknown"]);

function parseIocType(value: unknown): IocType | undefined {
  return typeof value === "string" && iocTypes.has(value as IocType) ? (value as IocType) : undefined;
}


async function startServer() {
  const app = express();
  const server = createServer(app);
  socWebSocketGateway.attach(server);

  app.disable("x-powered-by");
  app.use(requestLogger);
  app.use((_req, res, next) => {
    res.locals.cspNonce = randomBytes(16).toString("base64");
    next();
  });
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", (_req, res) => `'nonce-${(res as Response).locals.cspNonce}'`, ...configuredScriptSources],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Muitas requisicoes deste IP, tente novamente mais tarde.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use("/api", apiGateway);

  app.get("/api/providers/health", (_req, res) => {
    res.json({ success: true, data: iocAggregator.getHealth(), timestamp: new Date().toISOString() });
  });

  app.get("/api/attack-intelligence", (_req, res) => {
    const tenantId = currentTenantId();
    const incidents = incidentStore.summarize(tenantId, 1000);
    res.json({
      success: true,
      data: incidents.map((incident) => incident.attackIntelligence).filter(Boolean),
      campaigns: [],
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/attack-narratives", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({
      success: true,
      data: incidentStore.summarize(tenantId, 1000).map((incident) => incident.narrative).filter(Boolean),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/soc-actions", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({
      success: true,
      data: incidentStore.summarize(tenantId, 1000).flatMap((incident) => incident.actions ?? []),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/soc-responses", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({
      success: true,
      data: incidentStore.summarize(tenantId, 1000).flatMap((incident) => incident.responses ?? []),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/soc-orchestration", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({
      success: true,
      data: incidentStore.summarize(tenantId, 1000).flatMap((incident) => incident.orchestration ?? []),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/soc/dashboard", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: socGateway.dashboard(tenantId), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/health/dashboard", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: socGateway.healthDashboard(tenantId), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/system/snapshot", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: socGateway.systemSnapshot(tenantId), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/health", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: socGateway.healthDashboard(tenantId), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/alerts", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: listAlerts(tenantId), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/stream", (req, res) => {
    const wantsSSE = String(req.headers.accept ?? "").includes("text/event-stream");
    const tenantId = currentTenantId();
    if (!wantsSSE) {
      res.json({ success: true, data: socWebSocketGateway.list(tenantId, 100), status: socWebSocketGateway.status(), timestamp: new Date().toISOString() });
      return;
    }
    attachSSE(res, tenantId);
  });

  app.get("/api/soc/command-center/feed", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: socCommandCenter.feed(tenantId), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/command-center/stream", (_req, res) => {
    attachSSE(res, currentTenantId());
  });

  app.get("/api/soc/incidents/active", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: incidentStore.summarize(tenantId, 1000), timestamp: new Date().toISOString() });
  });


  app.get("/api/soc/campaigns/active", (_req, res) => {
    res.json({ success: true, data: threatNetwork.getFeed().campaigns, timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/automation/status", (_req, res) => {
    res.json({ success: true, data: limitedResponseEngine.status(currentTenantId()), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/remediation/status", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: { ...socSafeRemediationEngine.status(tenantId), failsafe: getFailsafeMode(), locks: globalExecutionLock.status(), idempotency: manusIdempotencyKeyManager.list(), eventSync: manusEventSync.status(), metrics: getRemediationMetrics() }, timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/self-healing/status", (_req, res) => {
    res.json({ success: true, data: socSelfHealingEngine.status(), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/remediation/reconcile", async (_req, res) => {
    res.json({ success: true, data: await manusReconciliationEngine.reconcile(), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc-autonomous-actions", (_req, res) => {
    res.json({ success: true, data: limitedResponseEngine.status(currentTenantId()), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc-evolution", (_req, res) => {
    res.json({ success: true, data: socEvolutionEngine.evaluate(), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/stabilizer", (_req, res) => {
    res.json({ success: true, data: runSOCStabilizer(), timestamp: new Date().toISOString() });
  });

  app.get("/api/soc-wargame", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({
      success: true,
      data: socWarGameEngine.snapshot(tenantId),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/global-defense-feed", (_req, res) => {
    res.json({
      success: true,
      data: defenseCoordinator.buildFeed(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/tenant/defense-posture", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: { tenantId, posture: getTenantDefensePosture(tenantId) }, timestamp: new Date().toISOString() });
  });

  app.post("/api/tenant/defense-posture", (req, res) => {
    const tenantId = currentTenantId();
    const body = req.body as { posture?: "relaxed" | "balanced" | "hardened" | "locked" };
    const posture = body.posture === "relaxed" || body.posture === "balanced" || body.posture === "hardened" || body.posture === "locked" ? body.posture : "balanced";
    res.json({ success: true, data: { tenantId, posture: setTenantDefensePosture(tenantId, posture) }, timestamp: new Date().toISOString() });
  });

  app.get("/api/global-threat-feed", (_req, res) => {
    res.json({
      success: true,
      data: threatNetwork.getFeed(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/tenant/threat-sharing", (_req, res) => {
    const tenantId = currentTenantId();
    res.json({ success: true, data: getThreatSharingSettings(tenantId), timestamp: new Date().toISOString() });
  });

  app.post("/api/tenant/threat-sharing", (req, res) => {
    const tenantId = currentTenantId();
    const body = req.body as { enabled?: boolean; iocSharing?: boolean; campaignSharing?: boolean; behavioralPatterns?: boolean };
    const data = setThreatSharingSettings({
      tenantId,
      enabled: Boolean(body.enabled),
      iocSharing: Boolean(body.iocSharing),
      campaignSharing: Boolean(body.campaignSharing),
      behavioralPatterns: Boolean(body.behavioralPatterns),
    });
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  });

  app.get("/api/tenant/context", (_req, res) => {
    const context = getTenantContext();
    if (!context) {
      res.status(401).json({ success: false, error: "Tenant context required" });
      return;
    }
    res.json({
      success: true,
      data: {
        tenantId: context.tenantId,
        role: context.role,
        permissions: context.permissions,
        usage: getTenantUsage(context.tenantId),
        featureFlags: getTenantFeatureFlags(context.tenantId),
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/soc/incidents/history", (_req, res) => {
    const tenantId = currentTenantId();
    const incidents = incidentStore.summarize(tenantId, 1000);
    res.json({
      success: true,
      data: {
        incidents,
        timeline: socTimelineBuilder.build(incidentStore.list(tenantId, 1000)),
        scoreEvolution: incidents.map((incident) => ({
          incidentId: incident.incidentId,
          timestamp: incident.timestamp,
          riskScore: incident.ioc.riskScore,
          threatScore: incident.scoring?.threatScore,
          correlationScore: incident.correlation?.correlationScore,
          aiRiskReevaluation: incident.aiOperator?.riskReevaluation,
        })),
        decisions: incidents.map((incident) => ({
          incidentId: incident.incidentId,
          actions: incident.actions?.map((action: { actionType?: string; priority?: string; confidence?: number }) => ({ actionType: action.actionType, priority: action.priority, confidence: action.confidence })),
          responses: incident.responses?.map((response: { responseType?: string; priority?: string; requiresApproval?: boolean; confidence?: number }) => ({ responseType: response.responseType, priority: response.priority, requiresApproval: response.requiresApproval, confidence: response.confidence })),
          aiOperator: incident.aiOperator ? { adjustedPriority: incident.aiOperator.adjustedPriority, confidence: incident.aiOperator.confidence } : undefined,
        })),
        metrics: getSOCMetrics(),
      },
      timestamp: new Date().toISOString(),
    });
  });


  app.get("/api/soc/incidents/:incidentId", (req, res) => {
    const tenantId = currentTenantId();
    const incident = incidentStore.findByIncidentId(req.params.incidentId, tenantId);
    if (!incident) {
      res.status(404).json({ success: false, error: "Incident not found" });
      return;
    }
    res.json({ success: true, data: { ...incident, timeline: socTimelineEngine.build(incident) }, timestamp: new Date().toISOString() });
  });

  app.get("/api/soc/incidents/:incidentId/replay", (req, res) => {
    const tenantId = currentTenantId();
    const replay = getTenantFeatureFlags(tenantId).replay ? incidentReplayEngine.replay(req.params.incidentId, tenantId) : undefined;
    if (!replay) {
      res.status(404).json({ success: false, error: "Incident not found" });
      return;
    }
    res.json({ success: true, data: replay, timestamp: new Date().toISOString() });
  });

  app.post("/api/ioc/aggregate", async (req, res, next) => {
    try {
      const body = req.body as { ioc?: string; type?: string };
      if (!body.ioc || typeof body.ioc !== "string") {
        res.status(400).json({ success: false, error: "IOC obrigatorio" });
        return;
      }
      const data = await iocAggregator.analyze({ value: body.ioc, type: parseIocType(body.type) });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "shield-security-scanner", timestamp: new Date().toISOString() });
  });

  app.get("/metrics", (_req, res) => {
    res.json(getMetrics());
  });

  app.use("/api/trpc", trpcMiddleware);

  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath, { index: false }));
  app.get("*", async (_req, res, next) => {
    try {
      const html = await readFile(path.join(staticPath, "index.html"), "utf8");
      res.type("html").send(html.replaceAll("%CSP_NONCE%", res.locals.cspNonce));
    } catch (error) {
      next(error);
    }
  });
  app.use(errorHandler);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    logger.info("server_started", { url: "http://localhost:" + String(port) });
  });
}

startServer().catch((error) => {
  logger.error("server_start_failed", { error: error instanceof Error ? error.message : String(error) });
});
