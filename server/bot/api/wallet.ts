import { apiRequest } from './client';
import { WalletBalance, TokenBalance, WalletOperationResponse, DepositAddress, WalletBalanceResponse } from '../models/wallet';

/**
 * Get deposit address for a specific network
 * @param accessToken User's access token
 * @param network Blockchain network (e.g., '137' for Polygon)
 * @returns Deposit address information
 */
export async function getDepositAddress(accessToken: string, network: string) {
  try {
    // Generate or get existing wallet for the network
    return await apiRequest<DepositAddress>({
      method: 'POST',
      url: '/api/wallets',
      data: { network },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get deposit address:', error);
    throw new Error(`Failed to retrieve deposit address: ${error.message}`);
  }
}

/**
 * Get wallet balances for a user across all networks
 * @param accessToken User's access token
 * @returns Wallet balances across networks
 */
export async function getWalletBalances(accessToken: string): Promise<WalletBalanceResponse> {
  try {
    console.log('Fetching wallet balances...');
    const response = await apiRequest<any>({
      method: 'GET',
      url: '/api/wallets',
      accessToken
    });
    
    console.log('Wallet API response:', JSON.stringify(response));
    
    // Handle multiple possible response formats
    let balances: WalletBalance[] = [];
    
    if (Array.isArray(response)) {
      // Direct array response
      balances = response;
    } else if (response && typeof response === 'object') {
      // Object with items array
      if (Array.isArray(response.items)) {
        balances = response.items;
      } else if (response.wallets && Array.isArray(response.wallets)) {
        // Object with wallets array
        balances = response.wallets;
      }
    }
    
    // Ensure each wallet has the required fields
    balances = balances.map(wallet => ({
      walletId: wallet.walletId || wallet.id || `wallet-${Math.random().toString(36).substring(2, 10)}`,
      network: wallet.network || 'unknown',
      balance: wallet.balance || '0',
      isDefault: wallet.isDefault || false,
      address: wallet.address || null,
      tokenBalances: wallet.tokenBalances || []
    }));
    
    console.log(`Processed ${balances.length} wallets`);
    
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
      url: '/api/wallets/default',
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
      url: '/api/wallets/default',
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
      url: '/api/wallets/balance',
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
      url: '/api/wallets',
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
      url: '/api/wallets/networks',
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
      url: `/api/wallets/${chainId}/tokens/${token}/balance`,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get token balance:', error);
    throw new Error(`Failed to retrieve token balance: ${error.message}`);
  }
}

/**
 * Recover tokens from wallet
 * @param accessToken User's access token
 * @param chainId Chain ID (e.g., '137' for Polygon)
 * @param amount Amount to recover
 * @param currency Currency symbol (e.g., 'USD')
 * @param toAccount Recipient account
 * @returns Operation result
 */
export async function recoverTokens(
  accessToken: string,
  chainId: string,
  amount: string,
  currency: string,
  toAccount: string,
  organizationId?: string
): Promise<string> {
  try {
    return await apiRequest<string>({
      method: 'POST',
      url: '/api/wallets/recover-tokens',
      data: {
        chainId,
        amount,
        currency,
        toAccount,
        organizationId
      },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to recover tokens:', error);
    throw new Error(`Failed to recover tokens: ${error.message}`);
  }
}