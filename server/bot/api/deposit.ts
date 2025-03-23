import { apiRequest } from './client';

/**
 * Deposit account interface
 * Represents a deposit account from the API
 */
export interface DepositAccount {
  bankName: string;
  bankAddress?: string;
  method: 'web3_wallet' | 'bank';
  country: string;
  bankAccountType?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  bankBeneficiaryName?: string;
  bankDepositMessage?: string;
  swiftCode?: string;
  feePercentage?: string;
}

/**
 * Get list of deposit accounts
 * @param accessToken User's access token
 * @returns List of deposit accounts
 */
export async function getDepositAccounts(accessToken: string): Promise<DepositAccount[]> {
  try {
    const response = await apiRequest<{ data: DepositAccount[] }>({
      method: 'GET',
      url: '/api/deposit-accounts',
      accessToken
    });
    
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get deposit accounts:', error);
    throw new Error(`Failed to retrieve deposit accounts: ${error.message}`);
  }
}

/**
 * Get a specific deposit account by ID
 * @param accessToken User's access token
 * @param id Deposit account ID
 * @returns Deposit account details
 */
export async function getDepositAccount(accessToken: string, id: string): Promise<DepositAccount> {
  try {
    return await apiRequest<DepositAccount>({
      method: 'GET',
      url: `/api/deposit-accounts/${id}`,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to get deposit account ${id}:`, error);
    throw new Error(`Failed to retrieve deposit account: ${error.message}`);
  }
}

/**
 * Create a virtual bank account for deposits
 * @param accessToken User's access token
 * @param network Network to create account for
 * @returns Created deposit account details
 */
export async function createDepositAccount(
  accessToken: string,
  network: string
): Promise<DepositAccount> {
  try {
    return await apiRequest<DepositAccount>({
      method: 'POST',
      url: '/api/deposit-accounts',
      data: { network },
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create deposit account:', error);
    throw new Error(`Failed to create deposit account: ${error.message}`);
  }
}