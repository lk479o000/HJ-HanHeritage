import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NoticeService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    content?: string;
    contentHtml?: string;
    type: string;
    scope: string;
  }) {
    const notice = await this.prisma.sysNotice.create({
      data: {
        title: data.title,
        content: data.content,
        contentHtml: data.contentHtml,
        type: data.type,
        scope: data.scope,
        status: 'draft',
      },
    });
    return {
      ...notice,
      id: notice.id.toString(),
      publishedAt: null,
    };
  }

  async findAll(page = 1, pageSize = 10, type?: string, status?: string) {
    const where = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.sysNotice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysNotice.count({ where }),
    ]);

    return {
      items: items.map((n) => ({
        ...n,
        id: n.id.toString(),
        publishedAt: n.publishedAt ? n.publishedAt.toISOString().split('T')[0] : null,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const notice = await this.prisma.sysNotice.findUnique({
      where: { id: BigInt(id) },
    });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }
    return {
      ...notice,
      id: notice.id.toString(),
      publishedAt: notice.publishedAt ? notice.publishedAt.toISOString().split('T')[0] : null,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
    };
  }

  async update(id: string, data: {
    title?: string;
    content?: string;
    contentHtml?: string;
    type?: string;
    scope?: string;
  }) {
    await this.findOne(id);
    const notice = await this.prisma.sysNotice.update({
      where: { id: BigInt(id) },
      data,
    });
    return {
      ...notice,
      id: notice.id.toString(),
      publishedAt: notice.publishedAt ? notice.publishedAt.toISOString().split('T')[0] : null,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.sysNotice.delete({ where: { id: BigInt(id) } });
    return null;
  }

  async publish(id: string) {
    await this.findOne(id);
    const notice = await this.prisma.sysNotice.update({
      where: { id: BigInt(id) },
      data: { status: 'published', publishedAt: new Date() },
    });
    return {
      ...notice,
      id: notice.id.toString(),
      publishedAt: notice.publishedAt ? notice.publishedAt.toISOString().split('T')[0] : null,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
    };
  }

  async draft(id: string) {
    await this.findOne(id);
    const notice = await this.prisma.sysNotice.update({
      where: { id: BigInt(id) },
      data: { status: 'draft', publishedAt: null },
    });
    return {
      ...notice,
      id: notice.id.toString(),
      publishedAt: null,
    };
  }
}
