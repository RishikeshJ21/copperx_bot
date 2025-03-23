import { apiRequest } from './client';

/**
 * Account interface based on API response
 */
export interface Account {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  type: 'web3_wallet' | 'bank';
  walletAccountType?: string;
  method: 'web3_wallet' | 'bank';
  country: string;
  network?: string;
  walletAddress?: string;
  isDefault: boolean;
  bankAccount?: BankAccount;
  accountKycs?: AccountKyc[];
  status: 'pending' | 'active' | 'rejected' | 'expired';
}

/**
 * Bank account details
 */
export interface BankAccount {
  bankName: string;
  bankAddress?: string;
  method: 'web3_wallet' | 'bank';
  bankAccountType: 'savings' | 'checking' | 'current';
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankBeneficiaryName: string;
  swiftCode?: string;
}

/**
 * KYC information for an account
 */
export interface AccountKyc {
  id: string;
  createdAt: string;
  updatedAt: string;
  accountId: string;
  providerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  supportRemittance: boolean;
  providerCode: string;
}

/**
 * Get all accounts for the authenticated user
 * @param accessToken User's access token
 * @returns List of accounts
 */
export async function getAllAccounts(accessToken: string): Promise<Account[]> {
  try {
    const response = await apiRequest<{ data: Account[] }>({
      method: 'GET',
      url: '/api/accounts',
      accessToken
    });
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get accounts:', error);
    throw new Error(`Failed to retrieve accounts: ${error.message}`);
  }
}

/**
 * Create a new account
 * @param accessToken User's access token
 * @param accountData Account data to create
 * @returns Created account
 */
export async function createAccount(
  accessToken: string, 
  accountData: {
    country: string;
    network?: string;
    walletAddress?: string;
    isDefault?: boolean;
    bankAccount?: BankAccount;
    providerId?: string;
  }
): Promise<Account> {
  try {
    return await apiRequest<Account>({
      method: 'POST',
      url: '/api/accounts',
      data: accountData,
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to create account:', error);
    throw new Error(`Failed to create account: ${error.message}`);
  }
}

/**
 * Get account details by ID
 * @param accessToken User's access token
 * @param accountId Account ID
 * @returns Account details
 */
export async function getAccountById(accessToken: string, accountId: string): Promise<Account> {
  try {
    return await apiRequest<Account>({
      method: 'GET',
      url: `/api/accounts/${accountId}`,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to get account ${accountId}:`, error);
    throw new Error(`Failed to retrieve account details: ${error.message}`);
  }
}

/**
 * Delete an account
 * @param accessToken User's access token
 * @param accountId Account ID
 * @returns Success message
 */
export async function deleteAccount(accessToken: string, accountId: string): Promise<{ message: string, statusCode: number }> {
  try {
    return await apiRequest<{ message: string, statusCode: number }>({
      method: 'DELETE',
      url: `/api/accounts/${accountId}`,
      accessToken
    });
  } catch (error: any) {
    console.error(`Failed to delete account ${accountId}:`, error);
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}

/**
 * Get new wallet account info
 * @param accessToken User's access token
 * @returns New wallet info
 */
export async function getNewWalletInfo(accessToken: string): Promise<{
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  walletType: string;
  network: string;
  walletAddress: string;
  isDefault: boolean;
}> {
  try {
    return await apiRequest<any>({
      method: 'POST',
      url: '/api/accounts/new-wallet',
      accessToken
    });
  } catch (error: any) {
    console.error('Failed to get new wallet info:', error);
    throw new Error(`Failed to get new wallet information: ${error.message}`);
  }
}

/**
 * Format account for display
 * @param account Account to format
 * @returns Formatted account string
 */
export function formatAccountForDisplay(account: Account): string {
  const accountType = account.type === 'web3_wallet' ? '💼 Crypto Wallet' : '🏦 Bank Account';
  const status = getStatusEmoji(account.status);
  
  let details = '';
  
  if (account.type === 'web3_wallet' && account.walletAddress) {
    const truncatedAddress = account.walletAddress.substring(0, 6) + '...' + 
      account.walletAddress.substring(account.walletAddress.length - 4);
    details = `Network: ${account.network || 'N/A'}\nAddress: ${truncatedAddress}`;
  } else if (account.bankAccount) {
    const { bankAccount } = account;
    const truncatedAccountNumber = '••••' + 
      bankAccount.bankAccountNumber.substring(Math.max(0, bankAccount.bankAccountNumber.length - 4));
    
    details = `Bank: ${bankAccount.bankName}\nAccount: ${truncatedAccountNumber}\nType: ${bankAccount.bankAccountType}\nBeneficiary: ${bankAccount.bankBeneficiaryName}`;
  }
  
  return `${accountType} ${account.isDefault ? '(Default)' : ''}\n${status} Status: ${account.status.toUpperCase()}\nID: ${account.id}\n${details}\nCreated: ${new Date(account.createdAt).toLocaleDateString()}`;
}

/**
 * Get emoji for account status
 * @param status Account status
 * @returns Emoji representing the status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'active':
      return '✅';
    case 'pending':
      return '⏳';
    case 'rejected':
      return '❌';
    case 'expired':
      return '⚠️';
    default:
      return '❓';
  }
}