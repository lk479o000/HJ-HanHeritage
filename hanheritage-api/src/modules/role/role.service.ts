import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.sysRole.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('角色编码已存在');
    }

    const role = await this.prisma.sysRole.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type ?? 1,
        dataScope: dto.dataScope,
        parentId: dto.parentId ?? null,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
      },
    });

    if (dto.menuIds?.length) {
      await this.prisma.sysRoleMenu.createMany({
        data: dto.menuIds.map((menuId) => ({
          roleId: role.id,
          menuId: BigInt(menuId),
        })),
      });
    }

    if (dto.permissionIds?.length) {
      await this.prisma.sysRolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    return this.findOne(role.id.toString());
  }

  async findAll() {
    const items = await this.prisma.sysRole.findMany({
      where: { delFlag: 0 },
      include: { menus: { include: { menu: true } }, permissions: true },
      orderBy: { sort: 'asc' },
    });
    return items.map((r) => ({
      ...r,
      id: r.id.toString(),
      parentId: r.parentId?.toString() ?? null,
      menus: r.menus.map((m) => ({ ...m.menu, id: m.menu.id.toString() })),
      permissionIds: r.permissions.map((p) => p.permissionId),
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.sysRole.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: { menus: { include: { menu: true } }, permissions: true },
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return {
      ...role,
      id: role.id.toString(),
      parentId: role.parentId?.toString() ?? null,
      menus: role.menus.map((m) => ({ ...m.menu, id: m.menu.id.toString() })),
      permissionIds: role.permissions.map((p) => p.permissionId),
    };
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    await this.prisma.sysRole.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type,
        dataScope: dto.dataScope,
        parentId: dto.parentId,
        sort: dto.sort,
        status: dto.status,
      },
    });

    if (dto.menuIds !== undefined) {
      await this.prisma.sysRoleMenu.deleteMany({ where: { roleId: BigInt(id) } });
      if (dto.menuIds.length) {
        await this.prisma.sysRoleMenu.createMany({
          data: dto.menuIds.map((menuId) => ({
            roleId: BigInt(id),
            menuId: BigInt(menuId),
          })),
        });
      }
    }

    if (dto.permissionIds !== undefined) {
      await this.prisma.sysRolePermission.deleteMany({ where: { roleId: BigInt(id) } });
      if (dto.permissionIds.length) {
        await this.prisma.sysRolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: BigInt(id),
            permissionId,
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.sysRolePermission.deleteMany({ where: { roleId: BigInt(id) } });
    await this.prisma.sysRoleMenu.deleteMany({ where: { roleId: BigInt(id) } });
    await this.prisma.sysRole.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }
}
