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
  userType?: 'admin' | 'visitor';
  currentPage?: string;
}

@Injectable()
export class OnlineUserService {
  private onlineUsers = new Map<string, OnlineUser>();
  private readonly TOKEN_EXPIRE_MS = 2 * 60 * 60 * 1000; // 2小时
  private readonly VISITOR_EXPIRE_MS = 30 * 60 * 1000; // 游客30分钟无活动视为离线

  private isExpired(user: OnlineUser, now: number) {
    const ttl = user.userType === 'visitor' ? this.VISITOR_EXPIRE_MS : this.TOKEN_EXPIRE_MS;
    return now - user.loginAt.getTime() >= ttl;
  }

  addUser(userId: string, name: string, token: string, ip?: string, client?: string, dept?: string) {
    this.removeByUserId(userId);
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

  touchVisitor(visitorId: string, currentPage?: string, ip?: string) {
    const id = `visitor_${visitorId}`;
    const existing = this.onlineUsers.get(id);
    this.onlineUsers.set(id, {
      id,
      userId: visitorId,
      name: existing?.name ?? '游客访客',
      dept: '游客端',
      ip: ip ?? existing?.ip,
      client: '游客端页面',
      loginAt: new Date(),
      token: '',
      userType: 'visitor',
      currentPage,
    });
    this.cleanExpiredUsers();
    return this.onlineUsers.get(id);
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
      user => !this.isExpired(user, now)
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
      if (this.isExpired(user, now)) {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.onlineUsers.delete(id));
  }
}
