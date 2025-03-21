import { apiRequest } from './client';
import { 
  Transfer, 
  TransferHistoryResponse, 
  TransferResponse, 
  TransferQuote, 
  SendFundsRequest,
  WalletWithdrawalRequest,
  BankWithdrawalRequest
} from '../models/transfer';

/**
 * Send funds to email recipient
 * @param accessToken User's access token
 * @param data Send funds request data
 * @returns Transfer response
 */
export async function sendFunds(
  accessToken: string, 
  data: SendFundsRequest
): Promise<TransferResponse> {
  try {
    return await apiRequest<TransferResponse>({
      method: 'POST',
      url: '/api/transfers/send',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to send funds:', error);
    throw new Error(`Failed to send funds: ${error.message}`);
  }
}

/**
 * Withdraw funds to external wallet
 * @param accessToken User's access token
 * @param data Wallet withdrawal request data
 * @returns Transfer response
 */
export async function withdrawToWallet(
  accessToken: string,
  data: WalletWithdrawalRequest
): Promise<TransferResponse> {
  try {
    return await apiRequest<TransferResponse>({
      method: 'POST',
      url: '/api/transfers/withdraw',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to withdraw to wallet:', error);
    throw new Error(`Failed to withdraw funds: ${error.message}`);
  }
}

/**
 * Withdraw funds to bank account
 * @param accessToken User's access token
 * @param data Bank withdrawal request data
 * @returns Transfer response
 */
export async function withdrawToBank(
  accessToken: string,
  data: BankWithdrawalRequest
): Promise<TransferResponse> {
  try {
    return await apiRequest<TransferResponse>({
      method: 'POST',
      url: '/api/transfers/offramp',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to withdraw to bank:', error);
    throw new Error(`Failed to withdraw to bank: ${error.message}`);
  }
}

/**
 * Get transfer history
 * @param accessToken User's access token
 * @param page Page number for pagination
 * @param limit Items per page
 * @param type Optional filter by transfer type
 * @returns Paginated transfer history
 */
export async function getTransferHistory(
  accessToken: string,
  page: number = 1,
  limit: number = 10,
  type?: string
): Promise<TransferHistoryResponse> {
  try {
    return await apiRequest<TransferHistoryResponse>({
      method: 'GET',
      url: '/api/transfers',
      params: { page, limit, type },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get transfer history:', error);
    throw new Error(`Failed to retrieve transfer history: ${error.message}`);
  }
}

/**
 * Get detailed information about a specific transfer
 * @param accessToken User's access token
 * @param transferId Transfer ID to look up
 * @returns Transfer details
 */
export async function getTransferDetails(accessToken: string, transferId: string) {
  try {
    return await apiRequest<Transfer>({
      method: 'GET',
      url: `/api/transfers/${transferId}`,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get transfer details:', error);
    throw new Error(`Failed to retrieve transfer details: ${error.message}`);
  }
}

/**
 * Get transfer fee quote
 * @param accessToken User's access token
 * @param amount Amount to transfer
 * @param network Network to use
 * @param type Transfer type
 * @returns Fee quote
 */
export async function getTransferFee(
  accessToken: string,
  amount: string,
  network: string,
  type: 'send' | 'withdraw' | 'bridge'
): Promise<TransferQuote> {
  try {
    return await apiRequest<TransferQuote>({
      method: 'GET',
      url: '/api/transfers/quote',
      params: { amount, network, type },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get transfer fee quote:', error);
    throw new Error(`Failed to retrieve fee quote: ${error.message}`);
  }
}

/**
 * Bridge tokens between networks
 * @param accessToken User's access token
 * @param sourceNetwork Source network
 * @param targetNetwork Target network
 * @param amount Amount to bridge
 * @returns Transfer response
 */
export async function bridgeTokens(
  accessToken: string,
  sourceNetwork: string,
  targetNetwork: string,
  amount: string
): Promise<TransferResponse> {
  try {
    return await apiRequest<TransferResponse>({
      method: 'POST',
      url: '/api/transfers/bridge',
      data: {
        sourceNetwork,
        targetNetwork,
        amount
      },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to bridge tokens:', error);
    throw new Error(`Failed to bridge tokens: ${error.message}`);
  }
}