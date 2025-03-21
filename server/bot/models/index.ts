import { Context, Scenes } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { AuthSessionData, UserData } from './auth';

// Import necessary scene types
type SceneSessionData = {
  // Add any scene-specific session data here
  state?: Record<string, any>;
};

/**
 * Base session state interface
 * Contains properties that should be available across all contexts
 */
export interface BaseSessionState {
  // User session data
  auth?: AuthSessionData;
  
  // Current user info
  user?: UserData;
  
  // KYC status (cached to reduce API calls)
  kycStatus?: any;
  
  // Flow-specific states
  login?: any;
  send?: any;
  withdraw?: any;
  deposit?: any;
  
  // Filters and preferences
  historyFilter?: string;
  
  // Last cache time (for refreshing data periodically)
  lastCacheTime?: {
    balance?: Date;
    kyc?: Date;
    history?: Date;
  };
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
  
  // Scene management
  scene: Scenes.SceneContextScene<CopperxContext, SceneSessionData>;
  wizard: Scenes.WizardContextWizard<CopperxContext>;
  
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