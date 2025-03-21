/**
 * Transfer interface
 * Represents a transfer transaction
 */
export interface Transfer {
  id: string;
  transferId: string;
  type: TransferType;
  amount: string;
  currency: string;
  status: TransferStatus;
  network?: string;
  recipient?: string;
  senderEmail?: string;
  recipientEmail?: string;
  walletAddress?: string;
  bankDetails?: BankDetails;
  createdAt: string;
  completedAt?: string;
  direction?: 'in' | 'out';
  fee?: string;
  metadata?: any;
}

/**
 * Transfer type enum
 * Types of transfers supported by the platform
 */
export enum TransferType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SEND = 'send',
  RECEIVE = 'receive',
  BRIDGE = 'bridge',
  BANK = 'bank',
}

/**
 * Transfer status enum
 * Possible states of a transfer
 */
export enum TransferStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
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