import { users, type User, type InsertUser, sessions, type Session, type InsertSession, walletSettings, type WalletSettings, type InsertWalletSettings, transfers, type Transfer, type InsertTransfer } from "@shared/schema";

// Interface for our storage system
export interface IStorage {
  // User methods
  getUser(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(telegramId: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Session methods
  getSession(telegramId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(telegramId: string, data: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(telegramId: string): Promise<boolean>;
  
  // Wallet settings methods
  getWalletSettings(telegramId: string): Promise<WalletSettings | undefined>;
  createWalletSettings(settings: InsertWalletSettings): Promise<WalletSettings>;
  updateWalletSettings(telegramId: string, data: Partial<InsertWalletSettings>): Promise<WalletSettings | undefined>;
  
  // Transfer history methods
  getTransfers(telegramId: string, limit: number, offset: number): Promise<Transfer[]>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransferById(transferId: string): Promise<Transfer | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private walletSettings: Map<string, WalletSettings>;
  private transfers: Map<string, Transfer>;
  private currentId: Record<string, number>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.walletSettings = new Map();
    this.transfers = new Map();
    this.currentId = {
      users: 1,
      sessions: 1,
      walletSettings: 1,
      transfers: 1,
    };
  }

  // User methods
  async getUser(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.telegramId === telegramId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(user.telegramId, newUser);
    return newUser;
  }

  async updateUser(telegramId: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(telegramId);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(telegramId, updatedUser);
    return updatedUser;
  }

  // Session methods
  async getSession(telegramId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.telegramId === telegramId);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.currentId.sessions++;
    const now = new Date();
    const newSession: Session = { 
      ...session, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.sessions.set(session.telegramId, newSession);
    return newSession;
  }

  async updateSession(telegramId: string, data: Partial<InsertSession>): Promise<Session | undefined> {
    const session = await this.getSession(telegramId);
    if (!session) return undefined;
    
    const updatedSession: Session = { 
      ...session, 
      ...data, 
      updatedAt: new Date() 
    };
    this.sessions.set(telegramId, updatedSession);
    return updatedSession;
  }

  async deleteSession(telegramId: string): Promise<boolean> {
    const session = await this.getSession(telegramId);
    if (!session) return false;
    
    this.sessions.delete(telegramId);
    return true;
  }

  // Wallet settings methods
  async getWalletSettings(telegramId: string): Promise<WalletSettings | undefined> {
    return Array.from(this.walletSettings.values()).find(
      settings => settings.telegramId === telegramId
    );
  }

  async createWalletSettings(settings: InsertWalletSettings): Promise<WalletSettings> {
    const id = this.currentId.walletSettings++;
    const now = new Date();
    const newSettings: WalletSettings = { 
      ...settings, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.walletSettings.set(settings.telegramId, newSettings);
    return newSettings;
  }

  async updateWalletSettings(telegramId: string, data: Partial<InsertWalletSettings>): Promise<WalletSettings | undefined> {
    const settings = await this.getWalletSettings(telegramId);
    if (!settings) return undefined;
    
    const updatedSettings: WalletSettings = { 
      ...settings, 
      ...data, 
      updatedAt: new Date() 
    };
    this.walletSettings.set(telegramId, updatedSettings);
    return updatedSettings;
  }

  // Transfer history methods
  async getTransfers(telegramId: string, limit: number, offset: number): Promise<Transfer[]> {
    const userTransfers = Array.from(this.transfers.values())
      .filter(transfer => transfer.telegramId === telegramId)
      .sort((a, b) => {
        const dateA = a.transferDate || a.createdAt;
        const dateB = b.transferDate || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
    
    return userTransfers.slice(offset, offset + limit);
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const id = this.currentId.transfers++;
    const newTransfer: Transfer = { 
      ...transfer, 
      id, 
      createdAt: new Date() 
    };
    this.transfers.set(transfer.transferId, newTransfer);
    return newTransfer;
  }

  async getTransferById(transferId: string): Promise<Transfer | undefined> {
    return this.transfers.get(transferId);
  }
}

// Export the storage instance
export const storage = new MemStorage();
