import { Context } from 'telegraf';
import { AuthSessionData, UserData } from './auth';

/**
 * Base session state interface
 * Contains properties that should be available across all contexts
 */
export interface BaseSessionState {
  // User session data
  auth?: AuthSessionData;
  
  // Current user info
  user?: UserData;
  
  // Flow-specific states
  login?: any;
  send?: any;
  withdraw?: any;
  
  // Filters and preferences
  historyFilter?: string;
}

/**
 * Enhanced context interface for Telegraf
 * Extends the base context with our custom properties
 */
export interface CopperxContext extends Context {
  // Session state
  session: BaseSessionState;
  
  // Session saver function
  saveSession: () => Promise<void>;
  
  // Command handlers (added as shortcuts)
  command?: {
    start: () => Promise<void>;
    help: () => Promise<void>;
    login: () => Promise<void>;
    balance: () => Promise<void>;
    wallets: () => Promise<void>;
    send: () => Promise<void>;
    withdraw: () => Promise<void>;
    deposit: () => Promise<void>;
    history: () => Promise<void>;
    kyc: () => Promise<void>;
    profile: () => Promise<void>;
  };
  
  // Notification manager
  notifications?: {
    setupForUser: (telegramId: string, accessToken: string, organizationId: string) => Promise<boolean>;
    disconnectUser: (telegramId: string) => boolean;
    activeConnections: Map<string, any>;
  };
}

/**
 * Response metadata interface
 * For standardizing API responses
 */
export interface ResponseMetadata {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}