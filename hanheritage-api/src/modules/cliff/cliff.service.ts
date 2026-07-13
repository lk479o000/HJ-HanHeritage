import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCliffDto } from './dto/create-cliff.dto';
import { CreateEntranceDto } from './dto/create-entrance.dto';

@Injectable()
export class CliffService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCliffDto) {
    const existing = await this.prisma.bizCliff.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('崖墓编码已存在');
    }

    const cliff = await this.prisma.bizCliff.create({
      data: {
        code: dto.code,
        name: dto.name,
        lng: dto.lng,
        lat: dto.lat,
        area: dto.area,
        level: dto.level,
        category: dto.category,
        dynasty: dto.dynasty,
        description: dto.description,
        status: dto.status ?? 1,
      },
    });
    return { ...cliff, id: cliff.id.toString() };
  }

  async findAll(page = 1, pageSize = 10, keyword?: string) {
    const where = {
      delFlag: 0,
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword } },
              { name: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.bizCliff.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { entrances: true, coffins: { where: { delFlag: 0 } } },
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
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const cliff = await this.prisma.bizCliff.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: { entrances: true, coffins: { where: { delFlag: 0 } } },
    });
    if (!cliff) {
      throw new NotFoundException('崖墓不存在');
    }
    return {
      ...cliff,
      id: cliff.id.toString(),
      entrances: cliff.entrances.map((e) => ({ ...e, id: e.id.toString(), cliffId: e.cliffId.toString() })),
      coffins: cliff.coffins.map((cf) => ({ ...cf, id: cf.id.toString(), cliffId: cf.cliffId?.toString() })),
    };
  }

  async update(id: string, dto: Partial<CreateCliffDto>) {
    await this.findOne(id);
    const cliff = await this.prisma.bizCliff.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        lng: dto.lng,
        lat: dto.lat,
        area: dto.area,
        level: dto.level,
        category: dto.category,
        dynasty: dto.dynasty,
        description: dto.description,
        status: dto.status,
      },
    });
    return { ...cliff, id: cliff.id.toString() };
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

  async findEntrances(page = 1, pageSize = 10) {
    const [items, total] = await Promise.all([
      this.prisma.bizEntrance.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bizEntrance.count(),
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
