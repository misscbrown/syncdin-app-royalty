import type { Router } from "express";

export function registerItemRoutes(router: Router): void {
  router.get("/", (_req, res) => {
    res.json({ message: "Get all items - implement in Phase 2" });
  });

  router.get("/:id", (req, res) => {
    res.json({ message: `Get item ${req.params.id} - implement in Phase 2` });
  });

  router.post("/", (_req, res) => {
    res.json({ message: "Create item - implement in Phase 2" });
  });

  router.put("/:id", (req, res) => {
    res.json({ message: `Update item ${req.params.id} - implement in Phase 2` });
  });

  router.delete("/:id", (req, res) => {
    res.json({ message: `Delete item ${req.params.id} - implement in Phase 2` });
  });
}
