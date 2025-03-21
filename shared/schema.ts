import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User account table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session store for Telegram bot
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  accessToken: text("access_token"),
  expireAt: timestamp("expire_at"),
  organizationId: text("organization_id"),
  sid: text("sid"),
  state: json("state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User wallet settings
export const walletSettings = pgTable("wallet_settings", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  defaultWalletId: text("default_wallet_id"),
  defaultNetwork: text("default_network"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User transfer history cache (optional, for faster lookups)
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  transferId: text("transfer_id").notNull(),
  type: text("type").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  network: text("network"),
  recipient: text("recipient"),
  createdAt: timestamp("created_at").defaultNow(),
  transferDate: timestamp("transfer_date"),
  metadata: json("metadata"),
});

// Schemas for inserting data
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletSettingsSchema = createInsertSchema(walletSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
});

// Types for the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertWalletSettings = z.infer<typeof insertWalletSettingsSchema>;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type WalletSettings = typeof walletSettings.$inferSelect;
export type Transfer = typeof transfers.$inferSelect;

// TypeScript types for Copperx API responses
export interface CopperxUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  organizationId: string;
  role: string;
  status: string;
  type: string;
  relayerAddress?: string;
  flags: string[];
  walletAddress?: string;
  walletId?: string;
  walletAccountType?: string;
}

export interface AuthResponse {
  scheme: string;
  accessToken: string;
  accessTokenId: string;
  expireAt: string;
  user: CopperxUser;
}
