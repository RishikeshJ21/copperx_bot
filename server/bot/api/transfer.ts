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
  return apiRequest<TransferResponse>({
    method: 'POST',
    url: '/api/transfers/send',
    data,
    accessToken
  });
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
  return apiRequest<TransferResponse>({
    method: 'POST',
    url: '/api/transfers/wallet-withdraw',
    data,
    accessToken
  });
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
  return apiRequest<TransferResponse>({
    method: 'POST',
    url: '/api/transfers/offramp',
    data,
    accessToken
  });
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
  return apiRequest<TransferHistoryResponse>({
    method: 'GET',
    url: '/api/transfers',
    params: { page, limit, type },
    accessToken
  });
}

/**
 * Get detailed information about a specific transfer
 * @param accessToken User's access token
 * @param transferId Transfer ID to look up
 * @returns Transfer details
 */
export async function getTransferDetails(accessToken: string, transferId: string) {
  return apiRequest<Transfer>({
    method: 'GET',
    url: `/api/transfers/${transferId}`,
    accessToken
  });
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
  return apiRequest<TransferQuote>({
    method: 'GET',
    url: '/api/transfers/quote',
    params: { amount, network, type },
    accessToken
  });
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
  return apiRequest<TransferResponse>({
    method: 'POST',
    url: '/api/transfers/bridge',
    data: {
      sourceNetwork,
      targetNetwork,
      amount
    },
    accessToken
  });
}