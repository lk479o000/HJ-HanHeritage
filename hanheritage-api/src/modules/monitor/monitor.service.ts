import { Injectable } from '@nestjs/common';
import { execFileSync } from 'child_process';
import os from 'os';
import Redis from 'ioredis';
import { OnlineUserService } from './online-user.service';

interface CpuSnapshot {
  user: number;
  sys: number;
  idle: number;
  total: number;
}

function readCpuSnapshot(): CpuSnapshot {
  const cpus = os.cpus();
  return cpus.reduce<CpuSnapshot>(
    (acc, cpu) => {
      const t = cpu.times;
      acc.user += t.user;
      acc.sys += t.sys;
      acc.idle += t.idle;
      acc.total += t.user + t.nice + t.sys + t.idle + t.irq;
      return acc;
    },
    { user: 0, sys: 0, idle: 0, total: 0 },
  );
}

export interface DiskInfo {
  filesystem: string;
  mount: string;
  total: number;
  used: number;
  free: number;
  usagePct: number;
}

@Injectable()
export class MonitorService {
  private lastCpu = readCpuSnapshot();
  private redisClient?: Redis;

  constructor(private onlineUserService: OnlineUserService) {}

  private readDisks(): DiskInfo[] {
    try {
      const output = execFileSync('df', ['-kP'], { encoding: 'utf8', timeout: 5000 });
      return output
        .split('\n')
        .slice(1)
        .map(line => line.trim().split(/\s+/))
        .filter(parts => parts.length >= 6 && !/^\d+$/.test(parts[0]))
        .map(parts => {
          const total = Number(parts[1]) * 1024;
          const used = Number(parts[2]) * 1024;
          const free = Number(parts[3]) * 1024;
          const usagePct = total > 0 ? (used / total) * 100 : 0;
          return {
            filesystem: parts[0],
            mount: parts.slice(5).join(' '),
            total,
            used,
            free,
            usagePct,
          };
        })
        .filter(d => d.total > 0);
    } catch {
      return [];
    }
  }

  private readIp() {
    const addresses = Object.values(os.networkInterfaces())
      .flat()
      .filter(item => item && item.family === 'IPv4' && !item.internal);
    return addresses[0]?.address || '127.0.0.1';
  }

  private getCpuUsage() {
    const current = readCpuSnapshot();
    const delta = {
      user: current.user - this.lastCpu.user,
      sys: current.sys - this.lastCpu.sys,
      idle: current.idle - this.lastCpu.idle,
      total: current.total - this.lastCpu.total,
    };
    this.lastCpu = current;
    if (delta.total <= 0) {
      const sum = current.user + current.sys + current.idle;
      return {
        userPct: sum > 0 ? (current.user / sum) * 100 : 0,
        sysPct: sum > 0 ? (current.sys / sum) * 100 : 0,
        idlePct: sum > 0 ? (current.idle / sum) * 100 : 0,
      };
    }
    return {
      userPct: (delta.user / delta.total) * 100,
      sysPct: (delta.sys / delta.total) * 100,
      idlePct: (delta.idle / delta.total) * 100,
    };
  }

  getServerInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpu = this.getCpuUsage();
    const disks = this.readDisks();
    const uptimeMs = os.uptime() * 1000;

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      osType: os.type(),
      osRelease: os.release(),
      arch: os.arch(),
      ip: this.readIp(),
      runtime: {
        name: `Node.js ${process.version}`,
        version: process.version,
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
        uptime: process.uptime() * 1000,
        home: process.execPath,
        projectPath: process.cwd(),
        args: [process.argv0, ...process.execArgv],
      },
      processMemory: process.memoryUsage(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      cpuUserPct: Number(cpu.userPct.toFixed(2)),
      cpuSysPct: Number(cpu.sysPct.toFixed(2)),
      cpuIdlePct: Number(cpu.idlePct.toFixed(2)),
      totalMemory,
      usedMemory,
      freeMemory,
      memoryPct: totalMemory > 0 ? Number(((usedMemory / totalMemory) * 100).toFixed(2)) : 0,
      uptime: uptimeMs,
      nodeVersion: process.version,
      pid: process.pid,
      cwd: process.cwd(),
      disks,
      nodes: [
        {
          name: `${os.hostname()}（应用节点）`,
          type: '服务器',
          status: '运行中',
          cpuPct: Number(cpu.userPct + cpu.sysPct),
          memUsed: usedMemory,
          memTotal: totalMemory,
        },
      ],
      collectedAt: new Date().toISOString(),
    };
  }

  getOnlineUsers(page = 1, pageSize = 10) {
    return this.onlineUserService.getOnlineUsers(page, pageSize);
  }

  forceLogout(id: string) {
    const removed = this.onlineUserService.removeUser(id);
    return { success: removed };
  }

  getOnlineCount() {
    return this.onlineUserService.getOnlineUsers(1, 1).count;
  }

  getOnlineUsersAll() {
    const { users } = this.onlineUserService.getOnlineUsers(1, Number.MAX_SAFE_INTEGER);
    return users;
  }

  private getRedisClient() {
    if (!this.redisClient) {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT || 6379),
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
      });
      this.redisClient.on('error', () => {
        // 连接异常由调用方处理，避免 ioredis 抛出未捕获异常
      });
    }
    return this.redisClient;
  }

  private parseInfo(raw: string) {
    const sections: Record<string, Record<string, string>> = {};
    let current = 'default';
    sections[current] = {};
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        if (trimmed.startsWith('# ')) {
          current = trimmed.slice(2).trim().toLowerCase();
          sections[current] = {};
        }
        return;
      }
      const idx = trimmed.indexOf(':');
      if (idx <= 0) return;
      sections[current][trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    });
    return sections;
  }

  async getRedisInfo() {
    const client = this.getRedisClient();
    try {
      if (client.status === 'wait' || client.status === 'end') {
        await client.connect();
      }
      const [info, commandInfo] = await Promise.all([
        client.info(),
        client.info('commandstats'),
      ]);
      const parsed = this.parseInfo(info);
      const commandParsed = this.parseInfo(commandInfo);
      const server = parsed.server || {};
      const clients = parsed.clients || {};
      const memory = parsed.memory || {};
      const cpu = parsed.cpu || {};
      const persistence = parsed.persistence || {};
      const stats = parsed.stats || {};
      const keyspace = parsed.keyspace || {};
      const commandstats = commandParsed.commandstats || {};

      const usedMemory = Number(memory.used_memory || 0);
      const maxMemory = Number(memory.maxmemory || 0);
      const keyCount = Object.values(keyspace).reduce((sum, item) => {
        const match = /keys=(\d+)/.exec(item);
        return sum + (match ? Number(match[1]) : 0);
      }, 0);
      const commands = Object.entries(commandstats)
        .map(([key, value]) => {
          const match = /calls=(\d+)/.exec(value);
          return { name: key.replace('cmdstat_', ''), count: match ? Number(match[1]) : 0 };
        })
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);
      const callTotal = commands.reduce((sum, item) => sum + item.count, 0);
      const commandMix = commands.slice(0, 12).map(item => ({
        name: item.name,
        count: item.count,
        pct: callTotal > 0 ? Number(((item.count / callTotal) * 100).toFixed(2)) : 0,
      }));
      if (commands.length > 12 && callTotal > 0) {
        const rest = commands.slice(12).reduce((sum, item) => sum + item.count, 0);
        commandMix.push({
          name: '其他',
          count: rest,
          pct: Number(((rest / callTotal) * 100).toFixed(2)),
        });
      }

      const uptimeSeconds = Number(server.uptime_in_seconds || 0);
      const sysCpu = Number(cpu.used_cpu_sys || 0);
      const userCpu = Number(cpu.used_cpu_user || 0);
      const cpuPct = uptimeSeconds > 0 ? ((sysCpu + userCpu) / uptimeSeconds) * 100 : 0;

      return {
        status: 'connected',
        version: server.redis_version || '',
        mode: server.redis_mode === 'standalone' ? '单机' : server.redis_mode || '单机',
        port: Number(server.tcp_port || 6379),
        clients: Number(clients.connected_clients || 0),
        uptimeSeconds,
        uptimeDays: Math.floor(uptimeSeconds / 86400),
        usedMemory,
        usedMemoryHuman: memory.used_memory_human || '0B',
        maxMemory,
        maxMemoryHuman: memory.maxmemory_human || '0B',
        memoryPct: maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0,
        cpuPct,
        aofEnabled: persistence.aof_enabled === '1',
        rdbLastStatus: persistence.rdb_last_bgsave_status || '',
        keyCount,
        netInKbps: Number(stats.instantaneous_input_kbps || 0),
        netOutKbps: Number(stats.instantaneous_output_kbps || 0),
        commands: commandMix,
        collectedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'disconnected',
        message: error instanceof Error ? error.message : 'Redis 连接失败',
      };
    }
  }
}
