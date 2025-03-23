import { apiRequest } from './client';
import { WalletBalance, TokenBalance, WalletOperationResponse, DepositAddress, WalletBalanceResponse } from '../models/wallet';

/**
 * Get deposit address for a specific network
 * @param accessToken User's access token
 * @param network Blockchain network (e.g., 'solana', 'ethereum')
 * @returns Deposit address information
 */
export async function getDepositAddress(accessToken: string, network: string) {
  try {
    return await apiRequest<DepositAddress>({
      method: 'GET',
      url: '/api/wallet/deposit-address',
      params: { network },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get deposit address:', error);
    throw new Error(`Failed to retrieve deposit address: ${error.message}`);
  }
}

/**
 * Get wallet balances for a user
 * @param accessToken User's access token
 * @returns Wallet balances across networks
 */
export async function getWalletBalances(accessToken: string): Promise<WalletBalanceResponse> {
  try {
    const response = await apiRequest<WalletBalance[]>({
      method: 'GET',
      url: '/api/wallet/balances',
      accessToken
    });
    
    // Format the response to match expected structure
    const balances = response || [];
    return {
      items: balances,
      total: balances.length
    };
  } catch (error: any) {
    console.error('Failed to get wallet balances:', error);
    throw new Error(`Failed to retrieve wallet balances: ${error.message}`);
  }
}

/**
 * Set a default wallet for transactions
 * @param accessToken User's access token
 * @param walletId Wallet ID to set as default
 * @returns Operation success status
 */
export async function setDefaultWallet(accessToken: string, walletId: string) {
  try {
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/wallet/default',
      data: { walletId },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to set default wallet:', error);
    throw new Error(`Failed to set default wallet: ${error.message}`);
  }
}

/**
 * Get default wallet
 * @param accessToken User's access token
 * @returns Default wallet information
 */
export async function getDefaultWallet(accessToken: string): Promise<WalletBalance> {
  try {
    return await apiRequest<WalletBalance>({
      method: 'GET',
      url: '/api/wallet/default',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get default wallet:', error);
    throw new Error(`Failed to retrieve default wallet: ${error.message}`);
  }
}

/**
 * Get wallet balance for default wallet
 * @param accessToken User's access token
 * @returns Token balance
 */
export async function getDefaultWalletBalance(accessToken: string): Promise<TokenBalance> {
  try {
    return await apiRequest<TokenBalance>({
      method: 'GET',
      url: '/api/wallet/balance',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get default wallet balance:', error);
    throw new Error(`Failed to retrieve wallet balance: ${error.message}`);
  }
}

/**
 * Get all wallets for a user
 * @param accessToken User's access token
 * @returns All user wallets
 */
export async function getAllWallets(accessToken: string): Promise<WalletBalanceResponse> {
  try {
    const response = await apiRequest<WalletBalance[]>({
      method: 'GET',
      url: '/api/wallet',
      accessToken
    });
    
    // Format the response to match expected structure
    const wallets = response || [];
    return {
      items: wallets,
      total: wallets.length
    };
  } catch (error: any) {
    console.error('Failed to get all wallets:', error);
    throw new Error(`Failed to retrieve wallets: ${error.message}`);
  }
}

/**
 * Get supported blockchain networks
 * @param accessToken User's access token
 * @returns List of supported networks
 */
export async function getSupportedNetworks(accessToken: string): Promise<string[]> {
  try {
    return await apiRequest<string[]>({
      method: 'GET',
      url: '/api/wallet/networks',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get supported networks:', error);
    throw new Error(`Failed to retrieve supported networks: ${error.message}`);
  }
}

/**
 * Get token balance for specific chain
 * @param accessToken User's access token
 * @param chainId Chain ID
 * @param token Token address or symbol
 * @returns Token balance
 */
export async function getTokenBalance(accessToken: string, chainId: string, token: string): Promise<TokenBalance> {
  try {
    return await apiRequest<TokenBalance>({
      method: 'GET',
      url: `/api/wallet/${chainId}/tokens/${token}/balance`,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get token balance:', error);
    throw new Error(`Failed to retrieve token balance: ${error.message}`);
  }
}