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
        // Restore session state with default fallbacks 
        typedCtx.session = {
          ...DEFAULT_SESSION_STATE,
          ...((session.state as any) || {})
        };
        
        // Restore authentication information from explicit fields (more reliable)
        if (session.accessToken) {
          // If we don't have auth data in session state or it's incomplete,
          // but we do have it in the dedicated fields, restore from there
          if (!typedCtx.session.auth || !typedCtx.session.auth.accessToken) {
            console.log(`Restoring auth data for user ${telegramId} from storage fields`);
            typedCtx.session.auth = {
              accessToken: session.accessToken,
              expireAt: session.expireAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 day expiry
              organizationId: session.organizationId || undefined,
              user: typedCtx.session.user || undefined
            };
          }
        }
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
          // Always update both the state object and dedicated auth fields
          // This provides redundancy and ensures auth isn't lost during serialization
          await storage.updateSession(telegramId, {
            state: typedCtx.session as any,
            accessToken: typedCtx.session.auth?.accessToken || null,
            expireAt: typedCtx.session.auth?.expireAt ? new Date(typedCtx.session.auth.expireAt) : null,
            organizationId: typedCtx.session.auth?.organizationId || null,
            sid: typedCtx.session.login?.sid || null
          });
          
          // Debug log for session persistence
          if (typedCtx.session.auth?.accessToken) {
            console.log(`Session updated for user ${telegramId} with valid auth token`);
          }
        } else {
          await storage.createSession({
            telegramId,
            state: typedCtx.session as any,
            accessToken: typedCtx.session.auth?.accessToken || null,
            expireAt: typedCtx.session.auth?.expireAt ? new Date(typedCtx.session.auth.expireAt) : null,
            sid: typedCtx.session.login?.sid || null,
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