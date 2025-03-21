import { Context, Middleware } from 'telegraf';
import { storage } from '../../storage';
import { config } from '../config';
import { BaseSessionState } from '../models';

/**
 * Sets up the session middleware to restore and persist session data
 */
export function setupMiddleware(): Middleware<Context> {
  return async (ctx, next) => {
    // Skip processing for non-user messages
    if (!ctx.from) {
      return next();
    }
    
    const telegramId = ctx.from.id.toString();
    
    try {
      // Get or create session
      let session = await storage.getSession(telegramId);
      
      if (!session) {
        // Create new session
        session = await storage.createSession({
          telegramId,
          accessToken: null,
          expireAt: null,
          organizationId: null,
          sid: null,
          state: {}
        });
        
        // Create user record if it doesn't exist
        const user = await storage.getUser(telegramId);
        if (!user) {
          await storage.createUser({
            telegramId,
            firstName: ctx.from.first_name || null,
            lastName: ctx.from.last_name || null,
            username: ctx.from.username || null,
            email: null
          });
        }
      }
      
      // Add session state to context
      const sessionState = session.state || {};
      ctx.session = sessionState as BaseSessionState;
      
      // Add session saver function to the context
      ctx.saveSession = async () => {
        await storage.updateSession(telegramId, {
          state: ctx.session
        });
      };
      
      // Call next middleware
      await next();
      
      // Save session after request
      if (ctx.session) {
        await storage.updateSession(telegramId, {
          state: ctx.session
        });
      }
    } catch (error) {
      console.error(`Session middleware error for ${telegramId}:`, error);
      await next();
    }
  };
}