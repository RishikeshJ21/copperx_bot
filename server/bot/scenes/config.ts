/**
 * Scene configuration options
 * Centralizes scene-related constants for easier management
 */

export const SCENE_IDS = {
  SEND: 'send_scene',
  DEPOSIT: 'deposit_scene',
  WITHDRAW: 'withdraw_scene',
  BALANCE: 'balance_scene',
  KYC: 'kyc_scene',
  SETTINGS: 'settings_scene',
  PROFILE: 'profile_scene',
  HELP: 'help_scene',
};

export const SCENE_FEATURES = {
  ENABLED: {
    SEND: true,
    DEPOSIT: true,
    WITHDRAW: true,
    BALANCE: true,
    KYC: true,
    SETTINGS: false, // Not implemented yet
    PROFILE: false,  // Not implemented yet
    HELP: false,     // Not implemented yet
  }
};

export const SCENE_TIMEOUT = {
  DEFAULT: 300000, // 5 minutes
  SHORT: 60000,    // 1 minute
  MEDIUM: 180000,  // 3 minutes
  LONG: 600000,    // 10 minutes
};

export const MARKUP_CONFIG = {
  BACK_TEXT: '🔙 Back',
  CANCEL_TEXT: '❌ Cancel',
  CONFIRM_TEXT: '✅ Confirm',
  BUTTON_ROW_SIZE: 2,
};

export const DEFAULT_MESSAGES = {
  UNAUTHORIZED: '🔒 You need to be logged in to use this feature. Please login first.',
  CANCELLED: '❌ Operation cancelled. What would you like to do next?',
  ERROR: '❌ An error occurred. Please try again later.',
  TIMEOUT: '⏱️ The operation timed out. Please try again.',
  UNDER_MAINTENANCE: '🛠️ This feature is currently under maintenance. Please try again later.',
  COMING_SOON: '🔜 This feature is coming soon!',
};

export const NETWORK_CONFIG = {
  SUPPORTED_NETWORKS: [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'optimism', name: 'Optimism', symbol: 'OP' },
    { id: 'base', name: 'Base', symbol: 'ETH' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  ],
  DEFAULT_NETWORK: 'ethereum',
};