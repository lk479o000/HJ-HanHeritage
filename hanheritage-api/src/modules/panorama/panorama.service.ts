import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePanoramaDto } from './dto/create-panorama.dto';

@Injectable()
export class PanoramaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePanoramaDto) {
    const panorama = await this.prisma.bizPanorama.create({
      data: {
        name: dto.name,
        category: dto.category,
        location: dto.location,
        description: dto.description,
        imageUrl: dto.imageUrl,
        fileSize: dto.fileSize ?? 0,
        status: dto.status ?? 1,
      },
    });
    return { ...panorama, id: panorama.id.toString() };
  }

  async findAll(
    page = 1,
    pageSize = 10,
    keyword?: string,
    category?: string,
    status?: string,
  ) {
    const where: any = {
      delFlag: 0,
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { location: { contains: keyword } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(status !== undefined && status !== ''
        ? { status: Number(status) }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.bizPanorama.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { viewpoints: true, hotspots: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bizPanorama.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        id: p.id.toString(),
        viewpoints: p.viewpoints.map((v) => ({ ...v, id: v.id.toString(), panoramaId: v.panoramaId.toString() })),
        hotspots: p.hotspots.map((h) => ({ ...h, id: h.id.toString(), panoramaId: h.panoramaId.toString() })),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const panorama = await this.prisma.bizPanorama.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: { viewpoints: true, hotspots: true },
    });
    if (!panorama) {
      throw new NotFoundException('全景不存在');
    }
    return {
      ...panorama,
      id: panorama.id.toString(),
      viewpoints: panorama.viewpoints.map((v) => ({ ...v, id: v.id.toString(), panoramaId: v.panoramaId.toString() })),
      hotspots: panorama.hotspots.map((h) => ({ ...h, id: h.id.toString(), panoramaId: h.panoramaId.toString() })),
    };
  }

  async update(id: string, dto: Partial<CreatePanoramaDto>) {
    await this.findOne(id);
    const panorama = await this.prisma.bizPanorama.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        category: dto.category,
        location: dto.location,
        description: dto.description,
        imageUrl: dto.imageUrl,
        fileSize: dto.fileSize,
        status: dto.status,
      },
    });
    return { ...panorama, id: panorama.id.toString() };
  }

  async uploadFile(id: string, fileUrl: string, fileSize = 0) {
    await this.findOne(id);
    const panorama = await this.prisma.bizPanorama.update({
      where: { id: BigInt(id) },
      data: { imageUrl: fileUrl, fileSize },
    });
    return { id: panorama.id.toString(), url: fileUrl, fileSize };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.bizPanorama.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }

  async addViewpoint(panoramaId: string, data: { name: string; lng?: number; lat?: number; height?: number }) {
    await this.findOne(panoramaId);
    const viewpoint = await this.prisma.bizPanoramaViewpoint.create({
      data: {
        panoramaId: BigInt(panoramaId),
        name: data.name,
        lng: data.lng,
        lat: data.lat,
        height: data.height,
      },
    });
    return { ...viewpoint, id: viewpoint.id.toString(), panoramaId: viewpoint.panoramaId.toString() };
  }

  async removeViewpoint(panoramaId: string, viewpointId: string) {
    await this.findOne(panoramaId);
    await this.prisma.bizPanoramaViewpoint.delete({
      where: { id: BigInt(viewpointId) },
    });
    return null;
  }

  async addHotspot(panoramaId: string, data: { type: string; config?: string; posX?: number; posY?: number }) {
    await this.findOne(panoramaId);
    const hotspot = await this.prisma.bizPanoramaHotspot.create({
      data: {
        panoramaId: BigInt(panoramaId),
        type: data.type,
        config: data.config,
        posX: data.posX,
        posY: data.posY,
      },
    });
    return { ...hotspot, id: hotspot.id.toString(), panoramaId: hotspot.panoramaId.toString() };
  }

  async removeHotspot(panoramaId: string, hotspotId: string) {
    await this.findOne(panoramaId);
    await this.prisma.bizPanoramaHotspot.delete({
      where: { id: BigInt(hotspotId) },
    });
    return null;
  }
}
