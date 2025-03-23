import { Telegraf, Markup } from 'telegraf';
import { CopperxContext } from '../models';
import { requireAdmin, isAdmin } from '../middleware/admin';
import { formatDate } from '../utils/format';
import { config } from '../config';

/**
 * Register admin command handlers
 * @param bot Telegraf bot instance
 */
export function registerAdminCommand(bot: Telegraf<CopperxContext>) {
  // Main admin command - only visible to admins
  bot.command('admin', requireAdmin, handleAdminCommand);
  
  // Admin action handlers
  bot.action('admin_stats', requireAdmin, showBotStats);
  bot.action('admin_broadcast', requireAdmin, startBroadcast);
  bot.action('admin_system', requireAdmin, showSystemInfo);
  bot.action('admin_back', requireAdmin, handleAdminCommand);
  
  // Listen for broadcast message (after admin initiated the broadcast flow)
  bot.on('message', async (ctx, next) => {
    // Only process if we're in broadcast mode and user is an admin
    if (
      ctx.session?.adminState?.awaitingBroadcast && 
      isAdmin(ctx) && 
      ctx.message && 
      'text' in ctx.message
    ) {
      return handleBroadcastMessage(ctx);
    }
    return next();
  });
  
  console.log('Admin commands registered');
}

/**
 * Handle the admin command
 * @param ctx Telegram context
 */
async function handleAdminCommand(ctx: CopperxContext) {
  await ctx.reply(
    '👑 *Admin Control Panel*\n\nSelect an option from the menu below:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Bot Statistics', callback_data: 'admin_stats' }],
          [{ text: '📢 Broadcast Message', callback_data: 'admin_broadcast' }],
          [{ text: '🖥️ System Info', callback_data: 'admin_system' }]
        ]
      }
    }
  );
}

/**
 * Show bot statistics
 * @param ctx Telegram context
 */
async function showBotStats(ctx: CopperxContext) {
  // Get stats from activeConnections (users currently with Pusher notifications)
  const activeUsers = ctx.notifications?.activeConnections.size || 0;
  
  // Here you would normally get all users from storage
  const totalUsers = 0; // placeholder, replace with actual query
  
  await ctx.editMessageText(
    '📊 *Bot Statistics*\n\n' +
    `Active users: ${activeUsers}\n` +
    `Total registered users: ${totalUsers}\n` +
    `API Base URL: ${config.api.baseURL}\n` +
    `Bot uptime: ${formatBotUptime()}\n`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '◀️ Back to Admin Panel', callback_data: 'admin_back' }]
        ]
      }
    }
  );
}

/**
 * Show system information
 * @param ctx Telegram context
 */
async function showSystemInfo(ctx: CopperxContext) {
  const memoryUsage = process.memoryUsage();
  const formattedMemory = {
    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
  };
  
  await ctx.editMessageText(
    '🖥️ *System Information*\n\n' +
    `Node.js version: ${process.version}\n` +
    `Memory usage (RSS): ${formattedMemory.rss} MB\n` +
    `Memory usage (Heap Total): ${formattedMemory.heapTotal} MB\n` +
    `Memory usage (Heap Used): ${formattedMemory.heapUsed} MB\n` +
    `Platform: ${process.platform}\n` +
    `Architecture: ${process.arch}\n` +
    `Process uptime: ${formatUptime(process.uptime())}\n`,
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Back to Admin Panel', 'admin_back')]
      ])
    }
  );
}

/**
 * Start broadcast flow
 * @param ctx Telegram context
 */
async function startBroadcast(ctx: CopperxContext) {
  // Set admin state to awaiting broadcast message
  if (!ctx.session.adminState) {
    ctx.session.adminState = {};
  }
  ctx.session.adminState.awaitingBroadcast = true;
  
  await ctx.editMessageText(
    '📢 *Broadcast Message*\n\n' +
    'Please send the message you want to broadcast to all users. ' +
    'The message will be sent as-is with Markdown formatting.\n\n' +
    '_Reply to this message with your broadcast text or click Cancel to abort._',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'admin_back')]
      ])
    }
  );
}

/**
 * Handle the broadcast message that the admin sent
 * @param ctx Telegram context
 */
async function handleBroadcastMessage(ctx: CopperxContext) {
  if (!ctx.message || !('text' in ctx.message)) {
    return ctx.reply('Please send a text message for broadcasting.');
  }
  
  const broadcastText = ctx.message.text;
  
  // Clear the awaiting broadcast state
  if (ctx.session.adminState) {
    ctx.session.adminState.awaitingBroadcast = false;
  }
  
  await ctx.reply(
    '✅ *Broadcast Preview*\n\n' +
    `${broadcastText}\n\n` +
    'Do you want to send this message to all users?',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Confirm', `broadcast_confirm_${Date.now()}`),
          Markup.button.callback('❌ Cancel', 'admin_back')
        ]
      ])
    }
  );
  
  // Add one-time action handler for the unique confirm button
  ctx.telegram.callbackQuery(`broadcast_confirm_${Date.now()}`, async (query) => {
    await query.answerCbQuery();
    
    // Here you would get all users from storage and send the message
    // This is a placeholder, implement actual broadcast logic based on your storage
    const sentCount = 0;
    
    await query.editMessageText(
      '📢 *Broadcast Sent*\n\n' +
      `Message sent to ${sentCount} users.\n\n` +
      `Message content: "${broadcastText.substring(0, 50)}${broadcastText.length > 50 ? '...' : ''}"`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Back to Admin Panel', 'admin_back')]
        ])
      }
    );
  });
}

/**
 * Format bot uptime as a readable string
 * @returns Formatted uptime string
 */
function formatBotUptime(): string {
  // Placeholder: implement based on when your bot was started
  // You could store the start time in a global variable when the bot starts
  return 'N/A - Add bot start time tracking';
}

/**
 * Format uptime in seconds to a readable string
 * @param uptime Uptime in seconds
 * @returns Formatted uptime string
 */
function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}