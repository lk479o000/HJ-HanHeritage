import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { OnlineUserService } from '../monitor/online-user.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private onlineUserService: OnlineUserService,
  ) {}

  async login(dto: LoginDto, ip?: string, client?: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { account: dto.username, delFlag: 0 },
      include: {
        roles: { include: { role: true } },
        dept: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const payload = {
      sub: user.id.toString(),
      account: user.account,
      name: user.name,
      roles: user.roles.map((r) => r.role.code),
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // 记录在线用户
    this.onlineUserService.addUser(
      user.id.toString(),
      user.name,
      token,
      ip,
      client,
      user.dept?.name
    );

    return {
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const newPayload = {
        sub: payload.sub,
        account: payload.account,
        name: payload.name,
        roles: payload.roles,
      };
      const token = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });
      return { token, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async getUserInfo(userId: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id: BigInt(userId), delFlag: 0 },
      include: {
        roles: { include: { role: { include: { menus: { include: { menu: true } } } } } },
        dept: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const menus = user.roles.flatMap((r) => r.role.menus.map((m) => m.menu));

    const uniqueMenus = [...new Map(menus.map((m) => [m.id, m])).values()];

    const permissions = [
      ...new Set(uniqueMenus.filter((m) => m.perms).map((m) => m.perms as string)),
    ];

    return {
      id: user.id.toString(),
      account: user.account,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      dept: user.dept
        ? { id: user.dept.id.toString(), name: user.dept.name }
        : null,
      roles: user.roles.map((r) => ({
        id: r.role.id.toString(),
        name: r.role.name,
        code: r.role.code,
      })),
      menus: uniqueMenus.map((m) => ({
        id: m.id.toString(),
        name: m.name,
        icon: m.icon,
        path: m.path,
        component: m.component,
        parentId: m.parentId?.toString(),
        type: m.type,
        sort: m.sort,
        perms: m.perms,
      })),
      permissions,
    };
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.sysUser.update({
      where: { id: BigInt(userId) },
      data: { password: hashedPassword },
    });

    return null;
  }
}
