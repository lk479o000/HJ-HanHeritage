import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findTree() {
    const items = await this.prisma.sysMenu.findMany({
      where: { delFlag: 0 },
      orderBy: { sort: 'asc' },
    });

    const list = items.map((m) => ({
      ...m,
      id: m.id.toString(),
      parentId: m.parentId?.toString() || '0',
      path: m.path?.replace(/^\/admin\//, '') || null,
    }));

    return this.buildTree(list);
  }

  private buildTree(items: (Record<string, unknown> & { id: string; parentId: string })[]) {
    const map = new Map<string, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    items.forEach((item) => map.set(item.id, { ...item, children: [] }));
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId === '0' || !map.has(item.parentId)) {
        roots.push(node);
      } else {
        const parent = map.get(item.parentId);
        (parent!.children as Record<string, unknown>[]).push(node);
      }
    });

    return roots;
  }

  async create(data: {
    name: string;
    icon?: string;
    parentId?: number;
    path?: string;
    component?: string;
    sort?: number;
    type: string;
    perms?: string;
    status?: number;
  }) {
    const menu = await this.prisma.sysMenu.create({
      data: {
        name: data.name,
        icon: data.icon,
        parentId: data.parentId ? BigInt(data.parentId) : 0,
        path: data.path,
        component: data.component,
        sort: data.sort ?? 0,
        type: data.type,
        perms: data.perms,
        status: data.status ?? 1,
      },
    });
    return { ...menu, id: menu.id.toString(), parentId: menu.parentId?.toString() || '0' };
  }

  async update(id: string, data: {
    name?: string;
    icon?: string;
    parentId?: number;
    path?: string;
    component?: string;
    sort?: number;
    type?: string;
    perms?: string;
    status?: number;
  }) {
    await this.findOne(id);
    const menu = await this.prisma.sysMenu.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        icon: data.icon,
        parentId: data.parentId !== undefined ? (data.parentId ? BigInt(data.parentId) : 0) : undefined,
        path: data.path,
        component: data.component,
        sort: data.sort,
        type: data.type,
        perms: data.perms,
        status: data.status,
      },
    });
    return { ...menu, id: menu.id.toString(), parentId: menu.parentId?.toString() || '0' };
  }

  async findOne(id: string) {
    const menu = await this.prisma.sysMenu.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
    });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    return { ...menu, id: menu.id.toString(), parentId: menu.parentId?.toString() || '0' };
  }

  async remove(id: string) {
    await this.findOne(id);
    const children = await this.prisma.sysMenu.count({
      where: { parentId: BigInt(id), delFlag: 0 },
    });
    if (children > 0) {
      throw new NotFoundException('存在子菜单，无法删除');
    }
    await this.prisma.sysMenu.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }
}
