import express, { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import dotenv from 'dotenv';
import { log, setupVite, serveStatic } from './vite';
import { registerRoutes } from './routes';
import { config } from './bot/config';
import { initializeBot } from './bot';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();

// Parse JSON request bodies
app.use(express.json());

// Set up error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  log('Express error: ' + err.message, 'express-error');
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start the server
async function main() {
  try {
    // Create HTTP server
    const server = await registerRoutes(app);
    
    // Set up Vite for development
    await setupVite(app, server);
    
    // In development mode, we don't need to serve static files
    // as Vite handles that for us. Only use serveStatic in production.
    if (process.env.NODE_ENV === 'production') {
      try {
        serveStatic(app);
      } catch (error) {
        console.warn('Static file serving skipped:', error.message);
      }
    }
    
    // Set the port
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Start the server first to ensure port is available and visible to Replit
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
      
      // Initialize the bot after the server is running
      // This ensures Replit detects the port as open first
      setTimeout(() => {
        initializeBot();
        log("Telegram bot initialized. Starting in the background...", "bot");
        
        // Start the bot in the background
        import('./bot')
          .then(botModule => {
            botModule.startBot()
              .then(() => log("Telegram bot started successfully!", "bot"))
              .catch(error => log("Failed to start Telegram bot: " + error.message, "bot-error"));
          })
          .catch(error => log("Failed to import bot module: " + error.message, "bot-error"));
      }, 1000); // Short delay to ensure server is recognized first
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
main();