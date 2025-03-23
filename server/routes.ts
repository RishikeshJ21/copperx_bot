import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the web interface, if needed
  app.get("/api/bot/status", (req, res) => {
    res.json({ status: "active" });
  });

  // Webhook endpoint for Telegram bot
  app.post("/webhook", async (req, res) => {
    try {
      // Verify the secret token if provided (for added security)
      const secretPathComponent = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (secretPathComponent) {
        const token = req.query.token;
        if (token !== secretPathComponent) {
          console.warn(`Webhook request with invalid token: ${token}`);
          return res.sendStatus(403); // Forbidden
        }
      }
      
      // Import the bot from the bot module to ensure it's initialized
      const { initializeBot } = await import('./bot');
      const bot = initializeBot();
      
      // Process the update
      await bot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing webhook update:', error);
      res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
