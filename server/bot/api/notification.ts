import axios from 'axios';
import { Telegraf } from 'telegraf';
import Pusher from 'pusher-js';
import { config } from '../config';
import { formatCurrency } from '../utils/format';

/**
 * Set up Pusher client for real-time notifications
 * @param accessToken User's access token
 * @param organizationId User's organization ID
 * @returns Authenticated Pusher instance
 */
function createPusherClient(accessToken: string, organizationId: string) {
  return new Pusher(config.pusher.key, {
    cluster: config.pusher.cluster,
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        try {
          // Authenticate with Copperx Pusher service
          const response = await axios.post(
            `${config.api.baseUrl}/api/${config.api.version}/pusher/auth`,
            {
              socket_id: socketId,
              channel_name: channel.name
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data) {
            callback(null, response.data);
          } else {
            callback(new Error('Pusher authentication failed'), null);
          }
        } catch (error) {
          console.error('Pusher authorization error:', error);
          callback(error as Error, null);
        }
      }
    })
  });
}

/**
 * Set up Pusher notifications for a specific user
 * @param bot Telegraf bot instance
 * @param telegramId User's Telegram ID
 * @param accessToken User's access token
 * @param organizationId User's organization ID
 */
export async function setupUserNotifications(
  bot: Telegraf,
  telegramId: string | number,
  accessToken: string,
  organizationId: string
) {
  console.log(`Setting up notifications for user: ${telegramId}, org: ${organizationId}`);
  
  try {
    // Create Pusher client
    const pusherClient = createPusherClient(accessToken, organizationId);
    
    // Subscribe to organization's private channel
    const channelName = `private-org-${organizationId}`;
    const channel = pusherClient.subscribe(channelName);
    
    // Debug event handlers
    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`Successfully subscribed ${telegramId} to ${channelName}`);
    });
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error(`Subscription error for ${telegramId}:`, error);
    });
    
    // Bind to deposit event
    channel.bind('deposit', (data: any) => {
      console.log(`Received deposit notification for ${telegramId}:`, data);
      
      bot.telegram.sendMessage(
        telegramId, 
        `💰 *New Deposit Received*\n\n` +
        `${formatCurrency(Number(data.amount))} USDC deposited on ${data.network || 'your wallet'}\n\n` +
        `Use /balance to check your updated balance.`,
        { parse_mode: 'Markdown' }
      ).catch(err => {
        console.error(`Failed to send notification to ${telegramId}:`, err);
      });
    });
    
    // Bind to transfer event
    channel.bind('transfer', (data: any) => {
      console.log(`Received transfer notification for ${telegramId}:`, data);
      
      bot.telegram.sendMessage(
        telegramId, 
        `📤 *Transfer Completed*\n\n` +
        `Your transfer of ${formatCurrency(Number(data.amount))} USDC has been ${data.status || 'processed'}.\n\n` +
        `Transfer ID: ${data.transferId || 'N/A'}\n` +
        `Use /history to see your transaction history.`,
        { parse_mode: 'Markdown' }
      ).catch(err => {
        console.error(`Failed to send notification to ${telegramId}:`, err);
      });
    });
    
    // Bind to withdrawal event
    channel.bind('withdrawal', (data: any) => {
      console.log(`Received withdrawal notification for ${telegramId}:`, data);
      
      bot.telegram.sendMessage(
        telegramId, 
        `🏦 *Withdrawal ${data.status === 'completed' ? 'Completed' : 'Updated'}*\n\n` +
        `Your withdrawal of ${formatCurrency(Number(data.amount))} USDC is now ${data.status || 'processing'}.\n\n` +
        `Withdrawal ID: ${data.transferId || 'N/A'}\n` +
        `Use /history to check your transaction history.`,
        { parse_mode: 'Markdown' }
      ).catch(err => {
        console.error(`Failed to send notification to ${telegramId}:`, err);
      });
    });
    
    // Return connection for tracking
    return {
      pusher: pusherClient,
      channel,
      channelName,
      organizationId
    };
  } catch (error) {
    console.error(`Failed to set up notifications for ${telegramId}:`, error);
    return null;
  }
}

// Map of active Pusher connections by telegram ID
const activeConnections = new Map();

/**
 * Set up Pusher notifications for all authenticated users
 * @param bot Telegraf bot instance
 */
export async function setupPusherNotifications(bot: Telegraf) {
  // Add a function to set up notifications for a user
  const setupForUser = async (telegramId: string | number, accessToken: string, organizationId: string) => {
    try {
      // Disconnect any existing connection
      disconnectUser(telegramId);
      
      // Create new connection
      const connection = await setupUserNotifications(bot, telegramId, accessToken, organizationId);
      
      // Store connection for future reference
      if (connection) {
        activeConnections.set(telegramId.toString(), connection);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error setting up notifications for ${telegramId}:`, error);
      return false;
    }
  };
  
  // Function to disconnect a user
  const disconnectUser = (telegramId: string | number) => {
    const id = telegramId.toString();
    const connection = activeConnections.get(id);
    
    if (connection) {
      try {
        // Unsubscribe and disconnect
        if (connection.channel && connection.channelName) {
          connection.pusher.unsubscribe(connection.channelName);
        }
        if (connection.pusher && connection.pusher.disconnect) {
          connection.pusher.disconnect();
        }
        
        // Remove from active connections
        activeConnections.delete(id);
        console.log(`Disconnected notifications for ${telegramId}`);
        return true;
      } catch (error) {
        console.error(`Error disconnecting notifications for ${telegramId}:`, error);
      }
    }
    
    return false;
  };
  
  // Add the notification helpers to the bot context
  bot.context.notifications = {
    setupForUser,
    disconnectUser,
    activeConnections
  };
  
  console.log('Pusher notification system initialized');
}