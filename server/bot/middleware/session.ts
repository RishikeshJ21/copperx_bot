import { Context, MiddlewareFn } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { BaseSessionState, CopperxContext } from '../models';
import { storage } from '../../storage';

const DEFAULT_SESSION_STATE: BaseSessionState = {
  auth: undefined,
  user: undefined,
  login: {
    step: 'idle',
    attemptCount: 0
  },
  send: {
    step: 'idle'
  },
  withdraw: {
    step: 'idle'
  },
  historyFilter: 'all'
};

/**
 * Sets up the session middleware to restore and persist session data
 */
export function setupMiddleware(): MiddlewareFn<Context> {
  return async (ctx: Context, next: () => Promise<void>) => {
    const telegramId = ctx.from?.id.toString();
    
    if (!telegramId) {
      return next();
    }
    
    // Type cast to our custom context
    const typedCtx = ctx as unknown as CopperxContext;
    
    // Try to load existing session
    try {
      const session = await storage.getSession(telegramId);
      
      // Initialize session if not exists
      if (session) {
        typedCtx.session = {
          ...DEFAULT_SESSION_STATE,
          ...((session.state as any) || {})
        };
      } else {
        typedCtx.session = { ...DEFAULT_SESSION_STATE };
        
        // Create new user if first interaction
        const existingUser = await storage.getUser(telegramId);
        if (!existingUser) {
          await storage.createUser({
            telegramId,
            firstName: ctx.from?.first_name || null,
            lastName: ctx.from?.last_name || null,
            username: ctx.from?.username || null,
            email: null
          });
        }
        
        // Create initial session entry
        await storage.createSession({
          telegramId,
          state: typedCtx.session as any,
          accessToken: null,
          expireAt: null,
          sid: null,
          organizationId: null
        });
      }
    } catch (error) {
      console.error('Error loading session:', error);
      typedCtx.session = { ...DEFAULT_SESSION_STATE };
    }
    
    // Add session saver method to context
    typedCtx.saveSession = async () => {
      try {
        const existingSession = await storage.getSession(telegramId);
        
        if (existingSession) {
          await storage.updateSession(telegramId, {
            state: typedCtx.session as any
          });
        } else {
          await storage.createSession({
            telegramId,
            state: typedCtx.session as any,
            accessToken: typedCtx.session.auth?.accessToken || null,
            expireAt: typedCtx.session.auth?.expireAt ? new Date(typedCtx.session.auth.expireAt) : null,
            sid: null,
            organizationId: typedCtx.session.auth?.organizationId || null
          });
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }
    };
    
    return next();
  };
}

/**
 * Clear all session data for a user
 * @param telegramId User's Telegram ID
 */
export async function clearSession(telegramId: string): Promise<boolean> {
  try {
    return await storage.deleteSession(telegramId);
  } catch (error) {
    console.error('Error clearing session:', error);
    return false;
  }
}