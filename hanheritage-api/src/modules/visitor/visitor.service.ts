import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnlineUserService } from '../monitor/online-user.service';

export interface VisitorEventDto {
  visitorId?: string;
  event: string;
  page?: string;
  targetId?: string;
  detail?: string;
}

const PAGE_LABELS: Record<string, string> = {
  home: '首页分布图',
  cliff: '崖墓详情',
  coffin: '石棺解读',
  'coffin-map': '石棺分布导览',
  panorama: '全景漫游',
};

@Injectable()
export class VisitorService {
  constructor(
    private prisma: PrismaService,
    private onlineUserService: OnlineUserService,
  ) {}

  async findCliffs() {
    const items = await this.prisma.bizCliff.findMany({
      where: { delFlag: 0, status: 1 },
      orderBy: { id: 'asc' },
      include: { _count: { select: { coffins: { where: { delFlag: 0, status: 1 } } } } },
    });
    return {
      items: items.map((c, index) => ({
        id: c.id.toString(),
        code: c.code,
        name: c.name,
        description: c.description ?? '',
        mapLeft: c.mapLeft,
        mapTop: c.mapTop,
        featured: c.featured,
        viewCount: c.viewCount,
        coverImage: c.coverImage,
        modelUrl: c.modelUrl,
        coffinCount: c._count.coffins,
        order: index + 1,
      })),
      total: items.length,
    };
  }

  async findCliff(id: string) {
    const cliff = await this.prisma.bizCliff.findFirst({
      where: { id: BigInt(id), delFlag: 0, status: 1 },
      include: {
        entrances: true,
        coffins: { where: { delFlag: 0, status: 1 }, orderBy: { id: 'asc' } },
        images: { orderBy: { sort: 'asc' } },
      },
    });
    if (!cliff) {
      throw new NotFoundException('崖墓不存在或已下架');
    }
    return {
      ...cliff,
      id: cliff.id.toString(),
      entrances: cliff.entrances.map((e) => ({
        ...e,
        id: e.id.toString(),
        cliffId: e.cliffId.toString(),
      })),
      images: cliff.images.map((img) => ({
        ...img,
        id: img.id.toString(),
        cliffId: img.cliffId.toString(),
      })),
      coffins: cliff.coffins.map((c) => ({
        id: c.id.toString(),
        code: c.code,
        name: c.name,
        thumbnail: c.thumbnail,
      })),
    };
  }

  async findCoffins() {
    const items = await this.prisma.bizCoffin.findMany({
      where: { delFlag: 0, status: 1 },
      orderBy: { id: 'asc' },
      include: {
        cliff: { select: { id: true, name: true } },
        images: { orderBy: { sort: 'asc' } },
        models: true,
      },
    });
    return {
      items: items.map((c, index) => ({
        ...c,
        id: c.id.toString(),
        cliffId: c.cliffId?.toString() ?? null,
        cliff: c.cliff ? { id: c.cliff.id.toString(), name: c.cliff.name } : null,
        images: c.images.map((img) => ({
          ...img,
          id: img.id.toString(),
          coffinId: img.coffinId.toString(),
        })),
        models: c.models.map((m) => ({
          ...m,
          id: m.id.toString(),
          coffinId: m.coffinId.toString(),
        })),
        order: index + 1,
      })),
      total: items.length,
    };
  }

  async findCoffin(id: string) {
    const coffin = await this.prisma.bizCoffin.findFirst({
      where: { id: BigInt(id), delFlag: 0, status: 1 },
      include: {
        cliff: { select: { id: true, name: true } },
        images: { orderBy: { sort: 'asc' } },
        models: true,
      },
    });
    if (!coffin) {
      throw new NotFoundException('石棺不存在或已下架');
    }
    return {
      ...coffin,
      id: coffin.id.toString(),
      cliffId: coffin.cliffId?.toString() ?? null,
      cliff: coffin.cliff ? { id: coffin.cliff.id.toString(), name: coffin.cliff.name } : null,
      images: coffin.images.map((img) => ({
        ...img,
        id: img.id.toString(),
        coffinId: img.coffinId.toString(),
      })),
      models: coffin.models.map((m) => ({
        ...m,
        id: m.id.toString(),
        coffinId: m.coffinId.toString(),
      })),
    };
  }

  async findPanoramas() {
    const items = await this.prisma.bizPanorama.findMany({
      where: { delFlag: 0, status: 1 },
      orderBy: { id: 'asc' },
    });
    return {
      items: items.map((p) => ({
        ...p,
        id: p.id.toString(),
      })),
      total: items.length,
    };
  }

  async findPanorama(id: string) {
    const panorama = await this.prisma.bizPanorama.findFirst({
      where: { id: BigInt(id), delFlag: 0, status: 1 },
      include: { viewpoints: true, hotspots: true },
    });
    if (!panorama) {
      throw new NotFoundException('全景不存在或已下架');
    }
    return {
      ...panorama,
      id: panorama.id.toString(),
      viewpoints: panorama.viewpoints.map((v) => ({
        ...v,
        id: v.id.toString(),
        panoramaId: v.panoramaId.toString(),
      })),
      hotspots: panorama.hotspots.map((h) => ({
        ...h,
        id: h.id.toString(),
        panoramaId: h.panoramaId.toString(),
      })),
    };
  }

  async findPublishedNotices(limit = 5) {
    const items = await this.prisma.sysNotice.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return {
      items: items.map((n) => ({
        ...n,
        id: n.id.toString(),
        publishedAt: n.publishedAt ? n.publishedAt.toISOString().split('T')[0] : null,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      total: items.length,
    };
  }

  private async resolveTargetName(dto: VisitorEventDto): Promise<string> {
    if (!dto.targetId) return '';
    try {
      if (dto.page === 'cliff') {
        const cliff = await this.prisma.bizCliff.findUnique({
          where: { id: BigInt(dto.targetId) },
          select: { name: true },
        });
        return cliff?.name ?? '';
      }
      if (dto.page === 'coffin') {
        const coffin = await this.prisma.bizCoffin.findUnique({
          where: { id: BigInt(dto.targetId) },
          select: { name: true },
        });
        return coffin?.name ?? '';
      }
      if (dto.page === 'panorama') {
        const panorama = await this.prisma.bizPanorama.findUnique({
          where: { id: BigInt(dto.targetId) },
          select: { name: true },
        });
        return panorama?.name ?? '';
      }
    } catch {
      return '';
    }
    return '';
  }

  private async increaseViewCount(dto: VisitorEventDto) {
    if (!dto.targetId) return;
    try {
      if (dto.event === 'cliff_view' && dto.page === 'cliff') {
        await this.prisma.bizCliff.update({
          where: { id: BigInt(dto.targetId) },
          data: { viewCount: { increment: 1 } },
        });
      } else if (dto.event === 'coffin_view' && dto.page === 'coffin') {
        await this.prisma.bizCoffin.update({
          where: { id: BigInt(dto.targetId) },
          data: { viewCount: { increment: 1 } },
        });
      } else if (dto.event === 'panorama_view' && dto.page === 'panorama') {
        await this.prisma.bizPanorama.update({
          where: { id: BigInt(dto.targetId) },
          data: { viewCount: { increment: 1 } },
        });
      }
    } catch {
      // 目标可能已被下架或删除，忽略计数即可，不影响事件落库
    }
  }

  async recordEvent(dto: VisitorEventDto, ip?: string) {
    const pageLabel = PAGE_LABELS[dto.page ?? ''] ?? '游客端';
    const isInteraction = /switch|interact/i.test(dto.event);
    const targetName = await this.resolveTargetName(dto);

    let description = `游客浏览${pageLabel}`;
    if (targetName) description += `「${targetName}」`;
    if (isInteraction && dto.detail) description += ` · ${dto.detail}`;

    await this.increaseViewCount(dto);

    await this.prisma.logOperation.create({
      data: {
        operator: '游客',
        type: isInteraction ? '交互' : '浏览',
        targetId: dto.targetId,
        description,
        method: 'POST',
        url: `/api/v1/visitor/${dto.page ?? 'event'}`,
        ip,
        status: 1,
      },
    });

    if (dto.visitorId) {
      this.onlineUserService.touchVisitor(dto.visitorId, pageLabel, ip);
    }

    return { recorded: true };
  }
}
