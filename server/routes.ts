import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeBot } from "./bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the web interface, if needed
  app.get("/api/bot/status", (req, res) => {
    res.json({ status: "active" });
  });

  // Add an endpoint to verify webhook is accessible
  app.get("/webhook", (req, res) => {
    res.json({ status: "webhook endpoint active" });
  });

  // Webhook endpoint for Telegram bot
  app.post("/webhook", async (req, res) => {
    try {
      console.log("Webhook request received", req.query);
      
      // Verify the secret token if provided (for added security)
      const secretPathComponent = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (secretPathComponent) {
        const token = req.query.token;
        if (token !== secretPathComponent) {
          console.warn(`Webhook request with invalid token: ${token}`);
          return res.sendStatus(403); // Forbidden
        }
      }
      
      // Initialize bot
      const bot = initializeBot();
      
      if (!req.body) {
        console.warn('Empty update received');
        return res.sendStatus(400);
      }
      
      console.log('Processing webhook update');
      
      // Process the update
      await bot.handleUpdate(req.body);
      console.log('Update processed successfully');
      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing webhook update:', error);
      res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
