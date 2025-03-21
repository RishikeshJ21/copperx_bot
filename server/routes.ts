import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the web interface, if needed
  app.get("/api/bot/status", (req, res) => {
    res.json({ status: "active" });
  });

  // Webhook endpoint for Telegram bot (optional, can be used instead of polling)
  app.post("/api/telegram/webhook", (req, res) => {
    // This would be used if you're configuring a webhook with Telegram
    res.sendStatus(200);
  });

  const httpServer = createServer(app);

  return httpServer;
}
