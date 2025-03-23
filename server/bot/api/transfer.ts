import { apiRequest } from './client';
import { 
  Transfer, 
  TransferHistoryResponse, 
  TransferResponse, 
  TransferQuote, 
  SendFundsRequest,
  WalletWithdrawalRequest,
  BankWithdrawalRequest,
  OnRampTransferRequest,
  OffRampTransferRequest,
  TransferSchedule
} from '../models/transfer';

/**
 * Get transfer history with optional filtering
 * @param accessToken User's access token
 * @param page Page number for pagination (starts from 1)
 * @param limit Items per page
 * @param filters Optional filters including type, status, etc.
 * @returns Paginated transfer history
 */
export async function getTransferHistory(
  accessToken: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    type?: string[];
    status?: string;
    sourceCountry?: string;
    destinationCountry?: string;
    startDate?: string;
    endDate?: string;
    sync?: boolean;
  }
): Promise<TransferHistoryResponse> {
  try {
    const params = {
      page,
      limit,
      ...filters
    };
    
    const response = await apiRequest<{
      page: number;
      limit: number;
      count: number;
      hasMore: boolean;
      data: Transfer[];
    }>({
      method: 'GET',
      url: '/api/transfers',
      params,
      accessToken
    });
    
    // Convert to our internal format
    return {
      items: response.data || [],
      total: response.count,
      page: response.page,
      limit: response.limit
    };
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
export async function getTransferDetails(accessToken: string, transferId: string): Promise<Transfer> {
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
 * Create an on-ramp transfer (for converting fiat to USDC)
 * @param accessToken User's access token
 * @param data On-ramp transfer data
 * @returns Transfer response
 */
export async function createOnRampTransfer(
  accessToken: string,
  data: OnRampTransferRequest
): Promise<Transfer> {
  try {
    return await apiRequest<Transfer>({
      method: 'POST',
      url: '/api/transfers/onramp',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create on-ramp transfer:', error);
    throw new Error(`Failed to create on-ramp transfer: ${error.message}`);
  }
}

/**
 * Create an off-ramp transfer (for converting USDC to fiat)
 * @param accessToken User's access token
 * @param data Off-ramp transfer data
 * @returns Transfer response
 */
export async function createOffRampTransfer(
  accessToken: string,
  data: OffRampTransferRequest
): Promise<Transfer> {
  try {
    return await apiRequest<Transfer>({
      method: 'POST',
      url: '/api/transfers/offramp',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create off-ramp transfer:', error);
    throw new Error(`Failed to create off-ramp transfer: ${error.message}`);
  }
}

/**
 * Withdraw funds to external wallet
 * @param accessToken User's access token
 * @param address Destination wallet address
 * @param amount Amount to withdraw
 * @param network Network to use
 * @param memo Optional memo
 * @returns Transfer response
 */
export async function withdrawToWallet(
  accessToken: string,
  address: string,
  amount: string,
  network: string,
  memo?: string
): Promise<Transfer> {
  try {
    const data: WalletWithdrawalRequest = {
      address,
      amount,
      network,
      memo
    };
    
    return await apiRequest<Transfer>({
      method: 'POST',
      url: '/api/transfers/wallet-withdraw',
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
 * @param amount Amount to withdraw
 * @param network Network to use
 * @param bankDetails Bank account details
 * @returns Transfer response
 */
export async function withdrawToBank(
  accessToken: string,
  amount: string,
  network: string,
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    reference?: string;
    country?: string;
    currency?: string;
  }
): Promise<Transfer> {
  try {
    const data: BankWithdrawalRequest = {
      amount,
      network,
      bankName: bankDetails.bankName,
      accountName: bankDetails.accountName,
      accountNumber: bankDetails.accountNumber,
      routingNumber: bankDetails.routingNumber,
      reference: bankDetails.reference,
      country: bankDetails.country || 'US',
      currency: bankDetails.currency || 'USD'
    };
    
    return await apiRequest<Transfer>({
      method: 'POST',
      url: '/api/transfers/bank-withdraw',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to withdraw to bank:', error);
    throw new Error(`Failed to withdraw funds to bank: ${error.message}`);
  }
}

/**
 * Send funds using wallet-to-wallet transfer
 * @param accessToken User's access token
 * @param data Wallet-to-wallet request data
 * @returns Transfer response
 */
export async function walletToWalletTransfer(
  accessToken: string, 
  data: {
    recipientWalletId: string;
    sourceWalletId: string;
    amount: string;
    note?: string;
  }
): Promise<Transfer> {
  try {
    return await apiRequest<Transfer>({
      method: 'POST',
      url: '/api/transfers/wallet-to-wallet',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to perform wallet-to-wallet transfer:', error);
    throw new Error(`Failed to send funds: ${error.message}`);
  }
}

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
    // Use the wallet-to-wallet endpoint or a specific email endpoint if available
    const response = await apiRequest<Transfer>({
      method: 'POST',
      url: '/api/transfers/email',
      data,
      accessToken
    });
    
    // Convert to our standard response format
    return {
      success: true,
      transferId: response.id,
      amount: response.amount,
      status: response.status as any,
      createdAt: response.createdAt,
      message: 'Transfer created successfully'
    };
  } catch (error: any) {
    console.error('Failed to send funds:', error);
    throw new Error(`Failed to send funds: ${error.message}`);
  }
}

/**
 * Get transfer quote (fees, etc.)
 * @param accessToken User's access token
 * @param quoteType Quote type (withdrawal, send, bridge)
 * @param data Quote request data
 * @returns Transfer quote
 */
export async function getTransferQuote(
  accessToken: string,
  quoteType: 'withdraw' | 'send' | 'bridge' | 'onramp' | 'offramp',
  data: {
    amount: string;
    network?: string;
    sourceNetwork?: string;
    targetNetwork?: string;
    wallet?: string;
    type?: string;
  }
): Promise<TransferQuote> {
  try {
    const response = await apiRequest<any>({
      method: 'POST',
      url: `/api/quotes/${quoteType}`,
      data,
      accessToken
    });
    
    // Standardize the response
    return {
      amount: data.amount,
      fee: response.fee || '0',
      total: response.total || data.amount,
      network: data.network || data.sourceNetwork || '',
      estimatedTime: response.estimatedCompletionTime || '',
      minAmount: response.minAmount || '0',
      maxAmount: response.maxAmount || '0'
    };
  } catch (error: any) {
    console.error('Failed to get transfer quote:', error);
    throw new Error(`Failed to retrieve quote: ${error.message}`);
  }
}

/**
 * Get onramp quote for converting fiat to USDC
 * @param accessToken User's access token
 * @param amount Amount to convert
 * @param sourceCountry Source country code
 * @param destinationCountry Destination country code
 * @param currency Currency code (e.g., "USD")
 * @param preferredSourcePaymentMethods Optional preferred payment methods
 * @param preferredProviderId Optional preferred provider ID
 * @returns Onramp quote
 */
export async function getOnrampQuote(
  accessToken: string,
  amount: string,
  sourceCountry: string = "usa",
  destinationCountry: string = "usa",
  currency: string = "USD",
  preferredSourcePaymentMethods?: string[],
  preferredProviderId?: string
): Promise<any> {
  try {
    const data = {
      sourceCountry,
      destinationCountry,
      amount,
      currency,
      preferredSourcePaymentMethods,
      preferredProviderId
    };
    
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/quotes/onramp',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get onramp quote:', error);
    throw new Error(`Failed to retrieve onramp quote: ${error.message}`);
  }
}

/**
 * Get offramp quote for converting USDC to fiat
 * @param accessToken User's access token
 * @param amount Amount to convert
 * @param sourceCountry Source country code
 * @param destinationCountry Destination country code
 * @param currency Currency code (e.g., "USD")
 * @param destinationCurrency Destination currency code
 * @param preferredDestinationPaymentMethods Optional preferred payment methods
 * @param preferredProviderId Optional preferred provider ID
 * @param payeeId Optional payee ID
 * @returns Offramp quote
 */
export async function getOfframpQuote(
  accessToken: string,
  amount: string,
  sourceCountry: string = "usa",
  destinationCountry: string = "usa",
  currency: string = "USD",
  destinationCurrency: string = "USD",
  preferredDestinationPaymentMethods?: string[],
  preferredProviderId?: string,
  payeeId?: string
): Promise<any> {
  try {
    const data = {
      sourceCountry,
      destinationCountry,
      amount,
      currency,
      destinationCurrency,
      preferredDestinationPaymentMethods,
      preferredProviderId,
      payeeId
    };
    
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/quotes/offramp',
      data,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get offramp quote:', error);
    throw new Error(`Failed to retrieve offramp quote: ${error.message}`);
  }
}

/**
 * Get transfer fee (simplified version of getTransferQuote)
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
    return await getTransferQuote(accessToken, type, { amount, network });
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
): Promise<Transfer> {
  try {
    return await apiRequest<Transfer>({
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