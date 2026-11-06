import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MonitorService } from '../monitor/monitor.service';

const MODULE_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\/visitor/i, label: '游客端' },
  { pattern: /\/cliffs?/i, label: '崖墓管理' },
  { pattern: /\/coffins?/i, label: '石棺管理' },
  { pattern: /\/users/i, label: '用户管理' },
  { pattern: /\/roles/i, label: '角色管理' },
  { pattern: /\/depts/i, label: '部门管理' },
  { pattern: /\/posts/i, label: '岗位管理' },
  { pattern: /\/menus/i, label: '菜单管理' },
  { pattern: /\/notices/i, label: '通知公告' },
  { pattern: /\/resources/i, label: '资源管理' },
  { pattern: /\/panoramas/i, label: '博物馆全景' },
  { pattern: /\/logs/i, label: '日志管理' },
  { pattern: /\/auth/i, label: '认证' },
  { pattern: /\/monitor/i, label: '系统监控' },
];

function moduleFromUrl(url?: string | null) {
  if (!url) return '系统';
  return MODULE_RULES.find(rule => rule.pattern.test(url))?.label || '系统';
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private monitorService: MonitorService,
  ) {}

  async getSummary() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const sevenDaysAgo = new Date(start.getTime());

    const [
      cliffs,
      coffins,
      panoramas,
      publishedNotices,
      users,
      operationLogs,
      loginLogs,
      resources,
      resourceGroups,
      notices,
      recentOps,
      loginTimes,
    ] = await Promise.all([
      this.prisma.bizCliff.count({ where: { delFlag: 0 } }),
      this.prisma.bizCoffin.count({ where: { delFlag: 0 } }),
      this.prisma.bizPanorama.count({ where: { delFlag: 0 } }),
      this.prisma.sysNotice.count({ where: { status: 'published' } }),
      this.prisma.sysUser.count({ where: { delFlag: 0 } }),
      this.prisma.logOperation.count(),
      this.prisma.logLogin.count(),
      this.prisma.bizResource.count({ where: { delFlag: 0 } }),
      this.prisma.bizResource.groupBy({
        by: ['type'],
        where: { delFlag: 0 },
        _count: { _all: true },
      }),
      this.prisma.sysNotice.findMany({
        where: { status: 'published' },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          content: true,
          contentHtml: true,
          scope: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.logOperation.findMany({
        orderBy: { operateTime: 'desc' },
        take: 6,
        select: {
          id: true,
          operator: true,
          operateTime: true,
          type: true,
          description: true,
          url: true,
          ip: true,
        },
      }),
      this.prisma.logLogin.findMany({
        where: { loginTime: { gte: sevenDaysAgo } },
        select: { loginTime: true },
      }),
    ]);

    const loginTrend: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      loginTrend.push({ date: dateKey(day), count: 0 });
    }
    loginTimes.forEach(item => {
      const key = dateKey(item.loginTime);
      const target = loginTrend.find(entry => entry.date === key);
      if (target) target.count += 1;
    });

    const onlineUsers = this.monitorService.getOnlineUsersAll();

    return {
      counts: {
        cliffs,
        coffins,
        panoramas,
        publishedNotices,
        users,
        onlineUsers: onlineUsers.length,
        operationLogs,
        loginLogs,
        resources,
      },
      notices: notices.map(item => ({
        id: item.id.toString(),
        title: item.title,
        content: item.content ?? '',
        contentHtml: item.contentHtml ?? '',
        scope: item.scope,
        publishedAt: (item.publishedAt ?? item.updatedAt).toISOString(),
      })),
      resourceStats: resourceGroups
        .map(group => ({ type: group.type, count: group._count._all }))
        .sort((a, b) => b.count - a.count),
      loginTrend,
      recentOperations: recentOps.map(row => ({
        id: row.id.toString(),
        at: row.operateTime.getTime(),
        userDisplay: row.operator ?? '—',
        module: moduleFromUrl(row.url),
        action: row.type ?? '—',
        detail: row.description ?? '',
        ip: row.ip ?? '',
      })),
      onlineUserList: onlineUsers.slice(0, 6).map(user => ({
        id: user.id,
        name: user.name,
        dept: user.dept || '',
        loginAt: user.loginAt.getTime(),
        ip: user.ip || '',
      })),
      collectedAt: now.toISOString(),
    };
  }
}
