/**
 * Wallet interface
 * Represents a cryptocurrency wallet
 */
export interface Wallet {
  id: string;
  walletId: string;
  network: string;
  balance: string;
  isDefault: boolean;
  address?: string;
  label?: string;
  type?: string;
  createdAt?: string;
}

/**
 * Wallet balance interface
 * Represents a wallet's balance information
 */
export interface WalletBalance {
  walletId: string;
  network: string;
  balance: string;
  isDefault: boolean;
  address?: string;
  tokenBalances?: TokenBalance[];
}

/**
 * Token balance interface
 * Represents a balance for a specific token in a wallet
 */
export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
}

/**
 * Deposit address interface
 * Represents a deposit address for a specific network
 */
export interface DepositAddress {
  address: string;
  network: string;
  qrCode?: string;
  instructions?: string;
  minAmount?: string;
}

/**
 * Wallet settings interface
 * Contains user preferences for wallet operations
 */
export interface WalletSettings {
  defaultNetwork?: string;
  defaultWalletId?: string;
  notificationsEnabled?: boolean;
  depositThreshold?: string;
}

/**
 * Network interface
 * Contains information about a supported blockchain network
 */
export interface Network {
  id: string;
  name: string;
  symbol: string;
  logo?: string;
  isActive: boolean;
  minDepositAmount?: string;
  minWithdrawalAmount?: string;
  depositFee?: string;
  withdrawalFee?: string;
}

/**
 * Wallet operation response
 * Standard response for wallet operations
 */
export interface WalletOperationResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Wallet balance response
 * API response for wallet balance requests
 */
export interface WalletBalanceResponse {
  items: WalletBalance[];
  total: number;
  
  // Adding array-like interface to make it easier to use with existing code
  length?: number;
  [index: number]: WalletBalance;
  map?: <T>(callbackfn: (value: WalletBalance, index: number, array: WalletBalance[]) => T) => T[];
  filter?: (predicate: (value: WalletBalance) => boolean) => WalletBalance[];
  find?: (predicate: (value: WalletBalance) => boolean) => WalletBalance | undefined;
  reduce?: <T>(callbackfn: (accumulator: T, current: WalletBalance) => T, initialValue: T) => T;
}