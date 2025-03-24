import type { Express } from "express";
import { createServer, type Server } from "http";
import { log } from './vite';
import { startBot } from "./bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the web interface, if needed
  app.get("/api/bot/status", (req, res) => {
    res.json({ status: "active", mode: process.env.TELEGRAM_WEBHOOK_DOMAIN ? "webhook" : "long-polling" });
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Add an endpoint to verify webhook is accessible
  app.get("/webhook", (req, res) => {
    res.json({ status: "webhook endpoint active" });
  });

  // Webhook endpoint for Telegram bot (only used when TELEGRAM_WEBHOOK_DOMAIN is set)
  app.post("/webhook", async (req, res) => {
    try {
      log("Webhook request received", "bot");
      
      // Verify the secret token if provided (for added security)
      const secretPathComponent = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (secretPathComponent) {
        const token = req.query.token;
        if (token !== secretPathComponent) {
          log(`Webhook request with invalid token: ${token}`, "bot-error");
          return res.sendStatus(403); // Forbidden
        }
      }
      
      if (!req.body) {
        log('Empty update received', "bot-error");
        return res.sendStatus(400);
      }
      
      // This won't be used in long polling mode as the bot is already launched
      // and handling updates directly from the Telegram API
      if (process.env.TELEGRAM_WEBHOOK_DOMAIN) {
        const bot = await startBot();
        if (bot) {
          log('Processing webhook update', "bot");
          await bot.handleUpdate(req.body);
          log('Update processed successfully', "bot");
          return res.sendStatus(200);
        }
      }
      
      // Bot not started in webhook mode
      res.sendStatus(500);
    } catch (error) {
      console.error('Error processing webhook update:', error);
      res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
