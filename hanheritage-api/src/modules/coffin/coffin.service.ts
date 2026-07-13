import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoffinDto } from './dto/create-coffin.dto';

@Injectable()
export class CoffinService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCoffinDto) {
    const existing = await this.prisma.bizCoffin.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('石棺编码已存在');
    }

    const coffin = await this.prisma.bizCoffin.create({
      data: {
        code: dto.code,
        name: dto.name,
        cliffId: dto.cliffId ? BigInt(dto.cliffId) : null,
        dynasty: dto.dynasty,
        grade: dto.grade,
        source: dto.source,
        completeness: dto.completeness,
        dimensions: dto.dimensions,
        texture: dto.texture,
        description: dto.description,
        thumbnail: dto.thumbnail,
        status: dto.status ?? 1,
      },
    });
    return { ...coffin, id: coffin.id.toString(), cliffId: coffin.cliffId?.toString() };
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
      this.prisma.bizCoffin.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { cliff: true, images: true, models: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bizCoffin.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        id: c.id.toString(),
        cliffId: c.cliffId?.toString(),
        cliff: c.cliff ? { ...c.cliff, id: c.cliff.id.toString() } : null,
        images: c.images.map((img) => ({ ...img, id: img.id.toString(), coffinId: img.coffinId.toString() })),
        models: c.models.map((m) => ({ ...m, id: m.id.toString(), coffinId: m.coffinId.toString() })),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const coffin = await this.prisma.bizCoffin.findUnique({
      where: { id: BigInt(id), delFlag: 0 },
      include: { cliff: true, images: true, models: true },
    });
    if (!coffin) {
      throw new NotFoundException('石棺不存在');
    }
    return {
      ...coffin,
      id: coffin.id.toString(),
      cliffId: coffin.cliffId?.toString(),
      cliff: coffin.cliff ? { ...coffin.cliff, id: coffin.cliff.id.toString() } : null,
      images: coffin.images.map((img) => ({ ...img, id: img.id.toString(), coffinId: img.coffinId.toString() })),
      models: coffin.models.map((m) => ({ ...m, id: m.id.toString(), coffinId: m.coffinId.toString() })),
    };
  }

  async update(id: string, dto: Partial<CreateCoffinDto>) {
    await this.findOne(id);
    const coffin = await this.prisma.bizCoffin.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        cliffId: dto.cliffId !== undefined ? (dto.cliffId ? BigInt(dto.cliffId) : null) : undefined,
        dynasty: dto.dynasty,
        grade: dto.grade,
        source: dto.source,
        completeness: dto.completeness,
        dimensions: dto.dimensions,
        texture: dto.texture,
        description: dto.description,
        thumbnail: dto.thumbnail,
        status: dto.status,
      },
    });
    return { ...coffin, id: coffin.id.toString(), cliffId: coffin.cliffId?.toString() };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.bizCoffin.update({
      where: { id: BigInt(id) },
      data: { delFlag: 1 },
    });
    return null;
  }

  async addImage(coffinId: string, imageUrl: string, imageType: string, sort?: number) {
    await this.findOne(coffinId);
    const image = await this.prisma.bizCoffinImage.create({
      data: {
        coffinId: BigInt(coffinId),
        imageUrl,
        imageType,
        sort: sort ?? 0,
      },
    });
    return { ...image, id: image.id.toString(), coffinId: image.coffinId.toString() };
  }

  async removeImage(coffinId: string, imageId: string) {
    await this.findOne(coffinId);
    await this.prisma.bizCoffinImage.delete({
      where: { id: BigInt(imageId) },
    });
    return null;
  }

  async addModel(coffinId: string, modelUrl: string, format: string, fileSize?: number) {
    await this.findOne(coffinId);
    const model = await this.prisma.bizCoffinModel.create({
      data: {
        coffinId: BigInt(coffinId),
        modelUrl,
        format,
        fileSize: fileSize ?? 0,
      },
    });
    return { ...model, id: model.id.toString(), coffinId: model.coffinId.toString() };
  }

  async removeModel(coffinId: string, modelId: string) {
    await this.findOne(coffinId);
    await this.prisma.bizCoffinModel.delete({
      where: { id: BigInt(modelId) },
    });
    return null;
  }
}
