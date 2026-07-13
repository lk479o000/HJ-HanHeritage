import { Injectable } from '@nestjs/common';

export interface OnlineUser {
  id: string;
  userId: string;
  name: string;
  dept?: string;
  ip?: string;
  client?: string;
  loginAt: Date;
  token: string;
}

@Injectable()
export class OnlineUserService {
  private onlineUsers = new Map<string, OnlineUser>();
  private readonly TOKEN_EXPIRE_MS = 2 * 60 * 60 * 1000; // 2小时

  addUser(userId: string, name: string, token: string, ip?: string, client?: string, dept?: string) {
    const id = `online_${userId}_${Date.now()}`;
    const onlineUser: OnlineUser = {
      id,
      userId,
      name,
      dept,
      ip,
      client,
      loginAt: new Date(),
      token,
    };
    this.onlineUsers.set(id, onlineUser);
    // 清理过期的用户
    this.cleanExpiredUsers();
    return onlineUser;
  }

  removeUser(id: string) {
    return this.onlineUsers.delete(id);
  }

  removeByUserId(userId: string) {
    const toRemove: string[] = [];
    for (const [id, user] of this.onlineUsers.entries()) {
      if (user.userId === userId) {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.onlineUsers.delete(id));
    return toRemove.length > 0;
  }

  getOnlineUsers(page = 1, pageSize = 10) {
    const now = Date.now();
    const users = Array.from(this.onlineUsers.values()).filter(
      user => now - user.loginAt.getTime() < this.TOKEN_EXPIRE_MS
    );
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      count: users.length,
      users: users.slice(start, end),
    };
  }

  cleanExpiredUsers() {
    const now = Date.now();
    const toRemove: string[] = [];
    for (const [id, user] of this.onlineUsers.entries()) {
      if (now - user.loginAt.getTime() >= this.TOKEN_EXPIRE_MS) {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.onlineUsers.delete(id));
  }
}
