import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; code: string; parentId?: number | null; sort?: number; remark?: string; status?: number; permissionIds?: string[] }) {
    const existing = await this.prisma.sysPost.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException('岗位编码已存在');
    }

    const post = await this.prisma.sysPost.create({
      data: {
        name: data.name,
        code: data.code,
        parentId: data.parentId ?? null,
        sort: data.sort ?? 0,
        remark: data.remark ?? null,
        status: data.status ?? 1,
      },
    });

    if (data.permissionIds?.length) {
      await this.prisma.sysPostPermission.createMany({
        data: data.permissionIds.map((permissionId) => ({
          postId: post.id,
          permissionId,
        })),
      });
    }

    return this.findOne(post.id.toString());
  }

  async findAll() {
    const items = await this.prisma.sysPost.findMany({
      where: { delFlag: 0 },
      include: { permissions: true },
      orderBy: { sort: 'asc' },
    });
    return items.map((p) => ({
      ...p,
      id: p.id.toString(),
      parentId: p.parentId?.toString() ?? null,
      permissionIds: p.permissions.map((pp) => pp.permissionId),
    }));
  }

  async findOne(id: string) {
    const post = await this.prisma.sysPost.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: { permissions: true },
    });
    if (!post) {
      throw new NotFoundException('岗位不存在');
    }
    return {
      ...post,
      id: post.id.toString(),
      parentId: post.parentId?.toString() ?? null,
      permissionIds: post.permissions.map((pp) => pp.permissionId),
    };
  }

  async update(id: string, data: { name?: string; code?: string; parentId?: number | null; sort?: number; remark?: string; status?: number; permissionIds?: string[] }) {
    await this.findOne(id);

    await this.prisma.sysPost.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        code: data.code,
        parentId: data.parentId,
        sort: data.sort,
        remark: data.remark,
        status: data.status,
      },
    });

    if (data.permissionIds !== undefined) {
      await this.prisma.sysPostPermission.deleteMany({ where: { postId: BigInt(id) } });
      if (data.permissionIds.length) {
        await this.prisma.sysPostPermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            postId: BigInt(id),
            permissionId,
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.sysPostPermission.deleteMany({ where: { postId: BigInt(id) } });
    await this.prisma.sysPost.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }
}
