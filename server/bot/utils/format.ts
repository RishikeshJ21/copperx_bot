import { format, formatDistance } from 'date-fns';

/**
 * Formats a currency value with 2 decimal places
 * @param value Number to format
 * @param decimals Number of decimal places to show (default: 2)
 * @returns Formatted string
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return Number(value).toFixed(decimals);
}

/**
 * Formats a date to a readable string
 * @param dateString Date string to format
 * @param format Format type: 'short', 'long', or 'relative'
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    switch (format) {
      case 'short':
        return date.toISOString().split('T')[0];
      case 'long':
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'relative':
        return formatDistance(date, new Date(), { addSuffix: true });
      default:
        return date.toISOString().split('T')[0];
    }
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Truncates long strings (like wallet addresses) with ellipsis
 * @param str String to truncate
 * @param startChars Number of characters to keep at start
 * @param endChars Number of characters to keep at end
 * @returns Truncated string
 */
export function truncateWithEllipsis(str: string, startChars: number = 6, endChars: number = 4): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;
  
  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}

/**
 * Formats a wallet address for display
 * @param address Wallet address to format
 * @returns Formatted address
 */
export function formatWalletAddress(address: string): string {
  if (!address) return 'N/A';
  return truncateWithEllipsis(address, 6, 4);
}

/**
 * Formats network name for display (capitalizes first letter)
 * @param network Network name to format
 * @returns Formatted network name
 */
export function formatNetworkName(network: string): string {
  if (!network) return 'N/A';
  return network.charAt(0).toUpperCase() + network.slice(1).toLowerCase();
}

/**
 * Formats a transaction status for display
 * @param status Status to format
 * @returns Formatted status with emoji
 */
export function formatTransactionStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return '✅ Completed';
    case 'pending':
      return '⏳ Pending';
    case 'processing':
      return '🔄 Processing';
    case 'failed':
      return '❌ Failed';
    case 'cancelled':
      return '🚫 Cancelled';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }
}

/**
 * Formats a KYC status for display
 * @param status KYC status to format
 * @returns Formatted status with emoji
 */
export function formatKycStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'verified':
      return '✅ Verified';
    case 'pending':
      return '⏳ Pending Review';
    case 'not_started':
      return '🔔 Not Started';
    case 'rejected':
      return '❌ Rejected';
    case 'expired':
      return '⚠️ Expired';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }
}