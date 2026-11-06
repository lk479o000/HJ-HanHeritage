import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface OperationLogQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

export interface OperationLogVo {
  id: string;
  at: number;
  userDisplay: string;
  module: string;
  action: string;
  detail: string;
  ip: string;
}

const MODULE_URL_RULES: Array<{ pattern: RegExp; label: string }> = [
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

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  private moduleFromUrl(url?: string | null): string {
    if (!url) return '—';
    for (const rule of MODULE_URL_RULES) {
      if (rule.pattern.test(url)) return rule.label;
    }
    return '系统';
  }

  private toOperationLogVo(row: {
    id: bigint;
    operator: string | null;
    operateTime: Date;
    type: string | null;
    description: string | null;
    ip: string | null;
    url: string | null;
  }): OperationLogVo {
    return {
      id: row.id.toString(),
      at: row.operateTime.getTime(),
      userDisplay: row.operator ?? '—',
      module: this.moduleFromUrl(row.url),
      action: row.type ?? '—',
      detail: row.description ?? '',
      ip: row.ip ?? '',
    };
  }

  private buildOperationWhere(query: OperationLogQuery): Prisma.LogOperationWhereInput {
    const where: Prisma.LogOperationWhereInput = {};
    const keyword = query.keyword?.trim();

    if (keyword) {
      where.OR = [
        { operator: { contains: keyword } },
        { type: { contains: keyword } },
        { description: { contains: keyword } },
        { ip: { contains: keyword } },
        { url: { contains: keyword } },
      ];
    }

    if (query.startTime || query.endTime) {
      where.operateTime = {};
      if (query.startTime) {
        const start = new Date(query.startTime);
        start.setHours(0, 0, 0, 0);
        where.operateTime.gte = start;
      }
      if (query.endTime) {
        const end = new Date(query.endTime);
        end.setHours(23, 59, 59, 999);
        where.operateTime.lte = end;
      }
    }

    return where;
  }

  async findLoginLogs(page = 1, pageSize = 10, keyword?: string) {
    const where = {
      ...(keyword
        ? {
            OR: [
              { username: { contains: keyword } },
              { ip: { contains: keyword } },
              { failReason: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.logLogin.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { loginTime: 'desc' },
      }),
      this.prisma.logLogin.count({ where }),
    ]);

    return {
      items: items.map((l) => ({
        ...l,
        id: l.id.toString(),
        loginTime: l.loginTime.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async exportLoginLogs(keyword?: string) {
    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { ip: { contains: keyword } },
            { failReason: { contains: keyword } },
          ],
        }
      : {};

    const items = await this.prisma.logLogin.findMany({
      where,
      orderBy: { loginTime: 'desc' },
      take: 5000,
    });

    return {
      items: items.map((l) => ({
        ...l,
        id: l.id.toString(),
        loginTime: l.loginTime.toISOString(),
      })),
      total: items.length,
    };
  }

  async findOperationLogs(query: OperationLogQuery = {}) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 10;
    const where = this.buildOperationWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.logOperation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { operateTime: 'desc' },
      }),
      this.prisma.logOperation.count({ where }),
    ]);

    return {
      items: items.map((row) => this.toOperationLogVo(row)),
      total,
      page,
      pageSize,
    };
  }

  async exportOperationLogs(query: OperationLogQuery = {}) {
    const where = this.buildOperationWhere(query);
    const items = await this.prisma.logOperation.findMany({
      where,
      orderBy: { operateTime: 'desc' },
      take: 5000,
    });

    return {
      items: items.map((row) => this.toOperationLogVo(row)),
      total: items.length,
    };
  }

  async deleteOperationLog(id: string) {
    await this.prisma.logOperation.delete({ where: { id: BigInt(id) } });
    return { deleted: 1 };
  }

  async deleteOperationLogs(ids: string[]) {
    const bigIds = ids.map((id) => BigInt(id));
    const result = await this.prisma.logOperation.deleteMany({
      where: { id: { in: bigIds } },
    });
    return { deleted: result.count };
  }

  async clearOperationLogs() {
    const result = await this.prisma.logOperation.deleteMany();
    return { deleted: result.count };
  }

  async deleteLoginLog(id: string) {
    await this.prisma.logLogin.delete({ where: { id: BigInt(id) } });
    return { deleted: 1 };
  }

  async deleteLoginLogs(ids: string[]) {
    const bigIds = ids.map((id) => BigInt(id));
    const result = await this.prisma.logLogin.deleteMany({
      where: { id: { in: bigIds } },
    });
    return { deleted: result.count };
  }

  async clearLoginLogs() {
    const result = await this.prisma.logLogin.deleteMany();
    return { deleted: result.count };
  }

  async createLoginLog(data: {
    username: string;
    ip?: string;
    os?: string;
    browser?: string;
    success: number;
    failReason?: string;
  }) {
    const log = await this.prisma.logLogin.create({ data });
    return {
      ...log,
      id: log.id.toString(),
      loginTime: log.loginTime.toISOString(),
    };
  }

  async createOperationLog(data: {
    operator?: string;
    type?: string;
    targetId?: string;
    description?: string;
    method?: string;
    url?: string;
    params?: string;
    status?: number;
    ip?: string;
    duration?: number;
  }) {
    const log = await this.prisma.logOperation.create({ data });
    return this.toOperationLogVo(log);
  }
}
