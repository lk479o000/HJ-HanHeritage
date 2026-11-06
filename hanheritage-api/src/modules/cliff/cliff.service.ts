import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCliffDto } from './dto/create-cliff.dto';
import { CreateEntranceDto } from './dto/create-entrance.dto';

@Injectable()
export class CliffService {
  constructor(private prisma: PrismaService) {}

  async checkModelUrl(raw?: string | null) {
    const url = raw?.trim();
    if (!url) {
      return { reachable: true, message: '未填写模型地址，游客端将显示“三维模型待补充”空态' };
    }
    if (/^https?:\/\//i.test(url)) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const head = await fetch(url, { method: 'HEAD', signal: controller.signal });
        if (head.ok) return { reachable: true, message: '模型地址可访问' };
        const get = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          signal: controller.signal,
        });
        if (get.ok || get.status === 206) return { reachable: true, message: '模型地址可访问' };
        return { reachable: false, message: `模型地址返回 HTTP ${get.status}` };
      } catch {
        return { reachable: false, message: '模型地址无法访问（网络不可达或超时）' };
      } finally {
        clearTimeout(timer);
      }
    }
    if (url.startsWith('/')) {
      const candidates = [
        join(process.cwd(), url),
        join(process.cwd(), '..', 'hanheritage-web', 'public', url),
      ];
      const found = candidates.find((p) => {
        try {
          return existsSync(p) && statSync(p).isFile();
        } catch {
          return false;
        }
      });
      return found
        ? { reachable: true, message: '模型文件存在' }
        : { reachable: false, message: '模型文件不存在，请检查路径' };
    }
    return { reachable: false, message: '仅支持 / 开头的站内路径或 http(s) 地址' };
  }

  private async assertModelUrl(url?: string | null) {
    if (url === undefined || url === null || !url.trim()) return;
    const result = await this.checkModelUrl(url);
    if (!result.reachable) {
      throw new BadRequestException(`${result.message}：${url}`);
    }
  }

  async create(dto: CreateCliffDto) {
    await this.assertModelUrl(dto.modelUrl);
    const code = dto.code || `YM${Date.now()}`;
    const existing = await this.prisma.bizCliff.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException('崖墓编码已存在');
    }

    const cliff = await this.prisma.bizCliff.create({
      data: {
        code,
        name: dto.name,
        lng: dto.lng,
        lat: dto.lat,
        area: dto.area,
        town: dto.town,
        address: dto.address,
        protectionUnitName: dto.protectionUnitName,
        composition: dto.composition,
        level: dto.level,
        category: dto.category,
        dynasty: dto.dynasty,
        description: dto.description,
        coverImage: dto.coverImage,
        modelUrl: dto.modelUrl,
        status: dto.status ?? 1,
        mapLeft: dto.mapLeft,
        mapTop: dto.mapTop,
        featured: dto.featured ?? 0,
        ...(dto.images?.length
          ? {
              images: {
                create: dto.images.map((img, index) => ({
                  imageUrl: img.imageUrl,
                  imageType: img.imageType || 'photo',
                  sort: img.sort ?? index,
                })),
              },
            }
          : {}),
      },
    });
    return { ...cliff, id: cliff.id.toString() };
  }

  async findAll(
    page = 1,
    pageSize = 10,
    keyword?: string,
    level?: string,
    town?: string,
    status?: string,
  ) {
    const where = {
      delFlag: 0,
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword } },
              { name: { contains: keyword } },
              { address: { contains: keyword } },
              { town: { contains: keyword } },
            ],
          }
        : {}),
      ...(level ? { level } : {}),
      ...(town ? { town } : {}),
      ...(status ? { status: Number(status) } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.bizCliff.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          entrances: true,
          coffins: { where: { delFlag: 0 } },
          images: { orderBy: { sort: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bizCliff.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        id: c.id.toString(),
        entrances: c.entrances.map((e) => ({ ...e, id: e.id.toString(), cliffId: e.cliffId.toString() })),
        coffins: c.coffins.map((cf) => ({ ...cf, id: cf.id.toString(), cliffId: cf.cliffId?.toString() })),
        images: c.images.map((img) => ({ ...img, id: img.id.toString(), cliffId: img.cliffId.toString() })),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const cliff = await this.prisma.bizCliff.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: {
        entrances: true,
        coffins: { where: { delFlag: 0 } },
        images: { orderBy: { sort: 'asc' } },
      },
    });
    if (!cliff) {
      throw new NotFoundException('崖墓不存在');
    }
    return {
      ...cliff,
      id: cliff.id.toString(),
      entrances: cliff.entrances.map((e) => ({ ...e, id: e.id.toString(), cliffId: e.cliffId.toString() })),
      coffins: cliff.coffins.map((cf) => ({ ...cf, id: cf.id.toString(), cliffId: cf.cliffId?.toString() })),
      images: cliff.images.map((img) => ({ ...img, id: img.id.toString(), cliffId: img.cliffId.toString() })),
    };
  }

  async update(id: string, dto: Partial<CreateCliffDto>) {
    await this.findOne(id);
    await this.assertModelUrl(dto.modelUrl);
    await this.prisma.bizCliff.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        lng: dto.lng,
        lat: dto.lat,
        area: dto.area,
        town: dto.town,
        address: dto.address,
        protectionUnitName: dto.protectionUnitName,
        composition: dto.composition,
        level: dto.level,
        category: dto.category,
        dynasty: dto.dynasty,
        description: dto.description,
        coverImage: dto.coverImage,
        modelUrl: dto.modelUrl,
        status: dto.status,
        mapLeft: dto.mapLeft,
        mapTop: dto.mapTop,
        featured: dto.featured,
      },
    });
    if (dto.images !== undefined) {
      await this.prisma.bizCliffImage.deleteMany({ where: { cliffId: BigInt(id) } });
      if (dto.images.length) {
        await this.prisma.bizCliffImage.createMany({
          data: dto.images.map((img, index) => ({
            cliffId: BigInt(id),
            imageUrl: img.imageUrl,
            imageType: img.imageType || 'photo',
            sort: img.sort ?? index,
          })),
        });
      }
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.bizCliff.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }

  async addEntrance(cliffId: string, dto: CreateEntranceDto) {
    await this.findOne(cliffId);
    const entrance = await this.prisma.bizEntrance.create({
      data: {
        cliffId: BigInt(cliffId),
        x: dto.x,
        y: dto.y,
        z: dto.z,
        direction: dto.direction,
        intro: dto.intro,
      },
    });
    return { ...entrance, id: entrance.id.toString(), cliffId: entrance.cliffId.toString() };
  }

  async removeEntrance(cliffId: string, entranceId: string) {
    await this.findOne(cliffId);
    await this.prisma.bizEntrance.delete({
      where: { id: BigInt(entranceId) },
    });
    return null;
  }

  async findEntrances(page = 1, pageSize = 10, cliffId?: string) {
    const where = cliffId ? { cliffId: BigInt(cliffId) } : {};
    const [items, total] = await Promise.all([
      this.prisma.bizEntrance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bizEntrance.count({ where }),
    ]);

    return {
      items: items.map((e) => ({
        ...e,
        id: e.id.toString(),
        cliffId: e.cliffId.toString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async updateEntrance(id: string, dto: Partial<CreateEntranceDto>) {
    const entrance = await this.prisma.bizEntrance.update({
      where: { id: BigInt(id) },
      data: {
        x: dto.x,
        y: dto.y,
        z: dto.z,
        direction: dto.direction,
        intro: dto.intro,
      },
    });
    return { ...entrance, id: entrance.id.toString(), cliffId: entrance.cliffId.toString() };
  }

  async deleteEntrance(id: string) {
    await this.prisma.bizEntrance.delete({
      where: { id: BigInt(id) },
    });
    return { deleted: 1 };
  }
}
