import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeptService {
  constructor(private prisma: PrismaService) {}

  async findTree() {
    const items = await this.prisma.sysDept.findMany({
      where: { delFlag: 0 },
      orderBy: { sort: 'asc' },
    });

    const list = items.map((d) => ({
      ...d,
      id: d.id.toString(),
      parentId: d.parentId?.toString() || '0',
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

  async create(data: { name: string; parentId?: number; sort?: number; leader?: string; status?: number }) {
    const dept = await this.prisma.sysDept.create({
      data: {
        name: data.name,
        parentId: data.parentId ? BigInt(data.parentId) : 0,
        sort: data.sort ?? 0,
        leader: data.leader,
        status: data.status ?? 1,
      },
    });
    return { ...dept, id: dept.id.toString(), parentId: dept.parentId?.toString() || '0' };
  }

  async update(id: string, data: { name?: string; parentId?: number; sort?: number; leader?: string; status?: number }) {
    await this.findOne(id);
    const dept = await this.prisma.sysDept.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        parentId: data.parentId !== undefined ? (data.parentId ? BigInt(data.parentId) : 0) : undefined,
        sort: data.sort,
        leader: data.leader,
        status: data.status,
      },
    });
    return { ...dept, id: dept.id.toString(), parentId: dept.parentId?.toString() || '0' };
  }

  async findOne(id: string) {
    const dept = await this.prisma.sysDept.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
    });
    if (!dept) {
      throw new NotFoundException('部门不存在');
    }
    return { ...dept, id: dept.id.toString(), parentId: dept.parentId?.toString() || '0' };
  }

  async remove(id: string) {
    await this.findOne(id);
    const children = await this.prisma.sysDept.count({
      where: { parentId: BigInt(id), delFlag: 0 },
    });
    if (children > 0) {
      throw new NotFoundException('存在子部门，无法删除');
    }
    await this.prisma.sysDept.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }
}
