import type { Router } from "express";

export function registerUserRoutes(router: Router): void {
  router.get("/", (_req, res) => {
    res.json({ message: "Get all users - implement in Phase 2" });
  });

  router.get("/:id", (req, res) => {
    res.json({ message: `Get user ${req.params.id} - implement in Phase 2` });
  });

  router.post("/", (_req, res) => {
    res.json({ message: "Create user - implement in Phase 2" });
  });

  router.put("/:id", (req, res) => {
    res.json({ message: `Update user ${req.params.id} - implement in Phase 2` });
  });

  router.delete("/:id", (req, res) => {
    res.json({ message: `Delete user ${req.params.id} - implement in Phase 2` });
  });
}
