import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    pageSize = 10,
    keyword?: string,
    folderId?: string,
    type?: string,
  ) {
    const where: Record<string, unknown> = { delFlag: 0 };

    if (keyword) {
      where['OR'] = [{ name: { contains: keyword } }, { remark: { contains: keyword } }];
    }
    if (folderId && folderId !== '0') {
      where['parentId'] = BigInt(folderId);
    } else {
      where['type'] = { not: 'folder' };
    }
    if (type && type !== 'folder') {
      where['type'] = type;
    }

    const [items, total] = await Promise.all([
      this.prisma.bizResource.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bizResource.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        ...r,
        id: r.id.toString(),
        parentId: r.parentId?.toString() || '0',
      })),
      total,
      page,
      pageSize,
    };
  }

  async findTree() {
    const items = await this.prisma.bizResource.findMany({
      where: { delFlag: 0 },
      orderBy: { createdAt: 'desc' },
    });

    const list = items.map((r) => ({
      ...r,
      id: r.id.toString(),
      parentId: r.parentId?.toString() || '0',
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

  async create(dto: CreateResourceDto) {
    const resource = await this.prisma.bizResource.create({
      data: {
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId ? BigInt(dto.parentId) : 0,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize ?? 0,
        mimeType: dto.mimeType,
        remark: dto.remark,
      },
    });
    return { ...resource, id: resource.id.toString(), parentId: resource.parentId?.toString() || '0' };
  }

  async findOne(id: string) {
    const resource = await this.prisma.bizResource.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
    });
    if (!resource) {
      throw new NotFoundException('资源不存在');
    }
    return { ...resource, id: resource.id.toString(), parentId: resource.parentId?.toString() || '0' };
  }

  async update(id: string, dto: Partial<CreateResourceDto>) {
    await this.findOne(id);
    const resource = await this.prisma.bizResource.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId !== undefined ? (dto.parentId ? BigInt(dto.parentId) : 0) : undefined,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        remark: dto.remark,
      },
    });
    return { ...resource, id: resource.id.toString(), parentId: resource.parentId?.toString() || '0' };
  }

  private async collectDescendantIds(id: bigint): Promise<bigint[]> {
    const children = await this.prisma.bizResource.findMany({
      where: { parentId: id, delFlag: 0 },
      select: { id: true },
    });
    const nested = await Promise.all(children.map(child => this.collectDescendantIds(child.id)));
    return [id, ...children.map(child => child.id), ...nested.flat()];
  }

  async remove(id: string) {
    await this.findOne(id);
    const ids = await this.collectDescendantIds(BigInt(id));
    await this.prisma.bizResource.updateMany({
      where: { id: { in: ids } },
      data: { delFlag: 1 },
    });
    return null;
  }

  async removeBatch(ids: string[]) {
    const numericIds = ids.map(id => BigInt(id));
    const allIds: bigint[] = [];
    for (const id of numericIds) {
      allIds.push(...(await this.collectDescendantIds(id)));
    }
    await this.prisma.bizResource.updateMany({
      where: { id: { in: [...new Set(allIds.map(item => item.toString()))].map(item => BigInt(item)) } },
      data: { delFlag: 1 },
    });
    return { deleted: allIds.length };
  }

  async move(id: string, targetParentId: number) {
    await this.findOne(id);
    const resource = await this.prisma.bizResource.update({
      where: { id: BigInt(id) },
      data: {
        parentId: targetParentId ? BigInt(targetParentId) : 0,
      },
    });
    return { ...resource, id: resource.id.toString(), parentId: resource.parentId?.toString() || '0' };
  }
}
