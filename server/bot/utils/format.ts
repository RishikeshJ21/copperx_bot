/**
 * Formats a currency value with 2 decimal places
 * @param value Number to format
 * @param decimals Number of decimal places to show (default: 2)
 * @returns Formatted string
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (isNaN(value)) {
    return '0.00';
  }
  
  return value.toFixed(decimals);
}

/**
 * Formats a date to a readable string
 * @param dateString Date string to format
 * @param format Format type: 'short', 'long', or 'relative'
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!dateString) {
    return 'N/A';
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    
    case 'long':
      return date.toLocaleString();
    
    case 'relative': {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 30) {
        return date.toLocaleDateString();
      } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    }
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
  if (!str) {
    return '';
  }
  
  if (str.length <= startChars + endChars) {
    return str;
  }
  
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

/**
 * Formats a wallet address for display
 * @param address Wallet address to format
 * @returns Formatted address
 */
export function formatWalletAddress(address: string): string {
  if (!address) {
    return 'N/A';
  }
  
  return truncateWithEllipsis(address, 8, 6);
}

/**
 * Formats network name for display (capitalizes first letter)
 * @param network Network name to format
 * @returns Formatted network name
 */
export function formatNetworkName(network: string): string {
  if (!network) {
    return 'N/A';
  }
  
  return network.charAt(0).toUpperCase() + network.slice(1).toLowerCase();
}

/**
 * Formats a transaction status for display
 * @param status Status to format
 * @returns Formatted status with emoji
 */
export function formatTransactionStatus(status: string): string {
  if (!status) {
    return '❓ Unknown';
  }
  
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'pending':
      return '⏳ Pending';
    case 'processing':
      return '🔄 Processing';
    case 'completed':
      return '✅ Completed';
    case 'failed':
      return '❌ Failed';
    case 'cancelled':
      return '🚫 Cancelled';
    default:
      return `❓ ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  }
}

/**
 * Formats a KYC status for display
 * @param status KYC status to format
 * @returns Formatted status with emoji
 */
export function formatKycStatus(status: string): string {
  if (!status) {
    return '❓ Unknown';
  }
  
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'not_started':
    case 'notstarted':
      return '🆕 Not Started';
    case 'pending':
      return '⏳ Pending';
    case 'verified':
      return '✅ Verified';
    case 'rejected':
      return '❌ Rejected';
    case 'expired':
      return '⚠️ Expired';
    default:
      return `❓ ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  }
}