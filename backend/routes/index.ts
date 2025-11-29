import type { Express } from "express";

export function registerRoutes(app: Express): void {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/users", (_req, res) => {
    res.json({ message: "Users endpoint - implement in Phase 2" });
  });

  app.get("/api/items", (_req, res) => {
    res.json({ message: "Items endpoint - implement in Phase 2" });
  });
}
