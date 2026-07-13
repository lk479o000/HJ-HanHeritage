import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { LogService } from '../log/log.service';

function maskPhone(phone: string | null): string {
  if (!phone || phone.length !== 11) return phone || '';
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private logService: LogService,
  ) {}

  async getPhone(id: string, operator?: string, ip?: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.logService.createOperationLog({
      operator,
      type: '查看',
      targetId: id,
      description: `查看用户完整手机号，用户ID: ${id}`,
      method: 'GET',
      url: `/users/${id}/phone`,
      ip,
    });

    return { phone: user.phone };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.sysUser.findUnique({
      where: { account: dto.account },
    });
    if (existing) {
      throw new ConflictException('账号已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.sysUser.create({
      data: {
        account: dto.account,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        avatar: dto.avatar,
        deptId: dto.deptId ? BigInt(dto.deptId) : null,
        status: dto.status ?? 1,
      },
    });

    if (dto.roleIds?.length) {
      await this.prisma.sysUserRole.createMany({
        data: dto.roleIds.map((roleId) => ({
          userId: user.id,
          roleId: BigInt(roleId),
        })),
      });
    }

    if (dto.postIds?.length) {
      await this.prisma.sysUserPost.createMany({
        data: dto.postIds.map((postId) => ({
          userId: user.id,
          postId: BigInt(postId),
        })),
      });
    }

    return this.findOne(user.id.toString());
  }

  async findAll(page = 1, pageSize = 10, keyword?: string) {
    const where = {
      delFlag: 0,
      ...(keyword
        ? {
            OR: [
              { account: { contains: keyword } },
              { name: { contains: keyword } },
              { phone: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.sysUser.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { dept: true, roles: { include: { role: true } }, posts: { include: { post: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysUser.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        ...u,
        id: u.id.toString(),
        phone: maskPhone(u.phone),
        deptId: u.deptId?.toString(),
        dept: u.dept ? { ...u.dept, id: u.dept.id.toString() } : null,
        roles: u.roles.map((r) => ({ ...r.role, id: r.role.id.toString() })),
        posts: u.posts.map((p) => ({ ...p.post, id: p.post.id.toString() })),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: { dept: true, roles: { include: { role: true } }, posts: { include: { post: true } } },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      ...user,
      id: user.id.toString(),
      phone: maskPhone(user.phone),
      deptId: user.deptId?.toString(),
      roles: user.roles.map((r) => ({ ...r.role, id: r.role.id.toString() })),
      posts: user.posts.map((p) => ({ ...p.post, id: p.post.id.toString() })),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar;
    if (dto.deptId !== undefined) {
      updateData.deptId = dto.deptId ? BigInt(dto.deptId) : null;
    }
    if (dto.status !== undefined) updateData.status = dto.status;

    await this.prisma.sysUser.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    if (dto.roleIds !== undefined) {
      await this.prisma.sysUserRole.deleteMany({ where: { userId: BigInt(id) } });
      if (dto.roleIds.length) {
        await this.prisma.sysUserRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: BigInt(id),
            roleId: BigInt(roleId),
          })),
        });
      }
    }

    if (dto.postIds !== undefined) {
      await this.prisma.sysUserPost.deleteMany({ where: { userId: BigInt(id) } });
      if (dto.postIds.length) {
        await this.prisma.sysUserPost.createMany({
          data: dto.postIds.map((postId) => ({
            userId: BigInt(id),
            postId: BigInt(postId),
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.sysUser.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }

  async toggleStatus(id: string) {
    const user = await this.findOne(id);
    await this.prisma.sysUser.update({
      where: { id: BigInt(id) },
      data: { status: user.status === 1 ? 0 : 1 },
    });
    return this.findOne(id);
  }
}
