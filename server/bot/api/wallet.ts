import { apiRequest } from './client';
import { WalletBalance, WalletBalanceResponse, DepositAddress, WalletOperationResponse } from '../models/wallet';

/**
 * Get wallet balances for a user
 * @param accessToken User's access token
 * @returns Wallet balances across networks
 */
export async function getWalletBalances(accessToken: string) {
  const response = await apiRequest<WalletBalanceResponse>({
    method: 'GET',
    url: '/api/wallets/balances',
    accessToken
  });
  
  return response.items || [];
}

/**
 * Set a default wallet for transactions
 * @param accessToken User's access token
 * @param walletId Wallet ID to set as default
 * @returns Operation success status
 */
export async function setDefaultWallet(accessToken: string, walletId: string) {
  return apiRequest<WalletOperationResponse>({
    method: 'PUT',
    url: '/api/wallets/default',
    data: { walletId },
    accessToken
  });
}

/**
 * Get deposit address for a specific network
 * @param accessToken User's access token
 * @param network Blockchain network (e.g., 'solana', 'ethereum')
 * @returns Deposit address information
 */
export async function getDepositAddress(accessToken: string, network: string) {
  return apiRequest<DepositAddress>({
    method: 'GET',
    url: `/api/wallets/deposit-address/${network}`,
    accessToken
  });
}

/**
 * Get a specific wallet by ID
 * @param accessToken User's access token
 * @param walletId Wallet ID to retrieve
 * @returns Wallet details
 */
export async function getWalletById(accessToken: string, walletId: string) {
  return apiRequest<WalletBalance>({
    method: 'GET',
    url: `/api/wallets/${walletId}`,
    accessToken
  });
}

/**
 * Get all wallets for a user
 * @param accessToken User's access token
 * @returns All user wallets
 */
export async function getAllWallets(accessToken: string) {
  const response = await apiRequest<{ items: WalletBalance[] }>({
    method: 'GET',
    url: '/api/wallets',
    accessToken
  });
  
  return response.items || [];
}