import { Injectable } from '@nestjs/common';
import os from 'os';
import { OnlineUserService } from './online-user.service';

@Injectable()
export class MonitorService {
  constructor(private onlineUserService: OnlineUserService) {}

  getServerInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      pid: process.pid,
      cwd: process.cwd(),
    };
  }

  getOnlineUsers(page = 1, pageSize = 10) {
    return this.onlineUserService.getOnlineUsers(page, pageSize);
  }

  forceLogout(id: string) {
    const removed = this.onlineUserService.removeUser(id);
    return { success: removed };
  }

  getRedisInfo() {
    return {
      status: 'disconnected',
      message: 'Redis not configured',
    };
  }
}
