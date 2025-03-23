/**
 * Transfer interface
 * Represents a transfer transaction based on API response
 */
export interface Transfer {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  status: TransferStatus;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    country: string;
  };
  type: TransferType;
  sourceCountry?: string;
  destinationCountry?: string;
  destinationCurrency?: string;
  amount: string;
  currency: string;
  amountSubtotal?: string;
  totalFee?: string;
  feePercentage?: string;
  feeCurrency?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  sourceOfFundsFile?: string;
  note?: string;
  purposeCode?: string;
  sourceOfFunds?: string;
  recipientRelationship?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  paymentUrl?: string;
  mode?: 'on_ramp' | 'off_ramp';
  isThirdPartyPayment?: boolean;
  
  // Backward compatibility for our existing code
  transferId?: string;
  network?: string;
  recipient?: string;
  senderEmail?: string;
  recipientEmail?: string;
  walletAddress?: string;
  bankDetails?: BankDetails;
  completedAt?: string;
  direction?: 'in' | 'out';
  fee?: string;
  metadata?: any;
  
  // Account information
  sourceAccount?: {
    id: string;
    type: string;
    country: string;
    network?: string;
    walletAddress?: string;
    bankName?: string;
    bankAccountNumber?: string;
  };
  
  destinationAccount?: {
    id: string;
    type: string;
    country: string;
    network?: string;
    walletAddress?: string;
    bankName?: string;
    bankAccountNumber?: string;
  };
  
  // Transactions related to this transfer
  transactions?: {
    id: string;
    status: string;
    type: string;
    fromAmount: string;
    fromCurrency: string;
    toAmount: string;
    toCurrency: string;
    totalFee: string;
    feeCurrency: string;
    transactionHash?: string;
  }[];
}

/**
 * Transfer type enum
 * Types of transfers supported by the platform as defined in the API
 */
export enum TransferType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  WITHDRAW = 'withdraw', // API variant
  SEND = 'send',
  RECEIVE = 'receive',
  BRIDGE = 'bridge',
  BANK = 'bank',
  BANK_DEPOSIT = 'bank_deposit',
  ON_RAMP = 'on_ramp',
  OFF_RAMP = 'off_ramp',
}

/**
 * Transfer status enum
 * Possible states of a transfer as defined in the API
 */
export enum TransferStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  COMPLETED = 'completed', // For backward compatibility
  CANCELED = 'canceled',
  CANCELLED = 'cancelled', // For backward compatibility
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Bank details interface
 * Information about a bank for withdrawals
 */
export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  reference?: string;
  iban?: string;
  swiftCode?: string;
  country?: string;
  currency?: string;
}

/**
 * Send funds request interface
 * Data required to send funds via email
 */
export interface SendFundsRequest {
  email: string;
  amount: string;
  network: string;
  message?: string;
}

/**
 * Wallet withdrawal request interface
 * Data required to withdraw to external wallet
 */
export interface WalletWithdrawalRequest {
  address: string;
  amount: string;
  network: string;
  memo?: string;
}

/**
 * Bank withdrawal request interface
 * Data required to withdraw to bank account
 */
export interface BankWithdrawalRequest {
  amount: string;
  network: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  reference?: string;
  country?: string;
  currency?: string;
}

/**
 * Bridge request interface
 * Data required to bridge tokens between networks
 */
export interface BridgeRequest {
  amount: string;
  sourceNetwork: string;
  targetNetwork: string;
}

/**
 * Transfer quote interface
 * Fee quote for a transfer
 */
export interface TransferQuote {
  amount: string;
  fee: string;
  total: string;
  network: string;
  estimatedTime?: string;
  exchangeRate?: string;
  minAmount?: string;
  maxAmount?: string;
}

/**
 * Transfer response interface
 * Response after initiating a transfer
 */
export interface TransferResponse {
  success: boolean;
  transferId?: string;
  amount?: string;
  fee?: string;
  status?: TransferStatus;
  createdAt?: string;
  estimatedCompletionTime?: string;
  message?: string;
  error?: string;
}

/**
 * Transfer history response interface
 * Response for transaction history requests
 */
export interface TransferHistoryResponse {
  items: Transfer[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Withdraw step enum
 * Steps in the withdrawal flow
 */
export enum WithdrawStep {
  IDLE = 'idle',
  SELECT_METHOD = 'select_method',
  ENTER_RECIPIENT = 'enter_recipient',
  ENTER_AMOUNT = 'enter_amount',
  ENTER_BANK_DETAILS = 'enter_bank_details',
  SELECT_NETWORK = 'select_network',
  CONFIRM_TRANSACTION = 'confirm_transaction',
}

/**
 * Withdraw state interface
 * Session state for withdrawal flow
 */
export interface WithdrawState {
  step: WithdrawStep;
  method?: 'wallet' | 'bank';
  recipient?: string;
  amount?: string;
  network?: string;
  fee?: string;
  wallets?: any[];
  bankDetails?: BankDetails;
}

/**
 * Send step enum
 * Steps in the send flow
 */
export enum SendStep {
  IDLE = 'idle',
  SELECT_METHOD = 'select_method',
  ENTER_RECIPIENT = 'enter_recipient',
  ENTER_AMOUNT = 'enter_amount',
  CONFIRM_TRANSACTION = 'confirm_transaction',
}

/**
 * Send state interface
 * Session state for send flow
 */
export interface SendState {
  step: SendStep;
  method?: 'email' | 'wallet';
  recipient?: string;
  amount?: string;
  network?: string;
  fee?: string;
  wallets?: any[];
}

/**
 * On-Ramp Transfer Request
 * For converting fiat to USDC
 */
export interface OnRampTransferRequest {
  invoiceNumber?: string;
  invoiceUrl?: string;
  purposeCode?: string;
  sourceOfFunds?: string;
  recipientRelationship?: string;
  quotePayload?: string;
  quoteSignature?: string;
  preferredWalletId?: string;
  customerData?: {
    name: string;
    businessName?: string;
    email: string;
    country: string;
  };
}

/**
 * Off-Ramp Transfer Request
 * For converting USDC to fiat
 */
export interface OffRampTransferRequest {
  invoiceNumber?: string;
  invoiceUrl?: string;
  purposeCode?: string;
  sourceOfFunds?: string;
  recipientRelationship?: string;
  quotePayload?: string;
  quoteSignature?: string;
  preferredWalletId?: string;
  customerData?: {
    name: string;
    businessName?: string;
    email: string;
    country: string;
  };
  sourceOfFundsFile?: string;
  note?: string;
}

/**
 * Transfer schedule frequency
 * Possible frequency options for scheduled transfers
 */
export enum ScheduleFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

/**
 * Transfer schedule interface
 * For creating and managing recurring transfers
 */
export interface TransferSchedule {
  id: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  type: 'withdrawal' | 'send' | 'bridge';
  frequency: ScheduleFrequency;
  nextExecutionDate: string;
  lastExecutionDate?: string;
  endDate?: string;
  amount: string;
  currency: string;
  network?: string;
  sourceNetwork?: string;
  targetNetwork?: string;
  recipient?: string;
  recipientType?: 'email' | 'wallet' | 'bank';
  recipientAddress?: string;
  recipientEmail?: string;
  recipientBankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    country?: string;
  };
  note?: string;
  executionCount: number;
  totalExecutions?: number;
  transferIds: string[];
}

/**
 * Schedule create request interface
 * Data required to create a scheduled transfer
 */
export interface CreateScheduleRequest {
  type: 'withdrawal' | 'send' | 'bridge';
  frequency: ScheduleFrequency;
  amount: string;
  currency: string;
  network?: string;
  sourceNetwork?: string;
  targetNetwork?: string;
  recipientType?: 'email' | 'wallet' | 'bank';
  recipientAddress?: string;
  recipientEmail?: string;
  recipientBankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    country?: string;
  };
  startDate?: string;
  endDate?: string;
  totalExecutions?: number;
  note?: string;
}