import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('游客端公开接口 (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('未携带 JWT 也能读取崖墓列表', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/visitor/cliffs').expect(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.total).toBe(res.body.data.items.length);
    for (const item of res.body.data.items) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(item.status).toBeUndefined();
      expect(item.delFlag).toBeUndefined();
    }
  });

  it('崖墓详情返回图片与石棺关联，下架或不存在时 404', async () => {
    const list = await request(app.getHttpServer()).get('/api/v1/visitor/cliffs').expect(200);
    const first = list.body.data.items[0];
    expect(first).toBeTruthy();

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/visitor/cliffs/${first.id}`)
      .expect(200);
    expect(detail.body.data.id).toBe(first.id);
    expect(Array.isArray(detail.body.data.images)).toBe(true);
    expect(Array.isArray(detail.body.data.coffins)).toBe(true);

    const missing = await request(app.getHttpServer())
      .get('/api/v1/visitor/cliffs/99999999')
      .expect(404);
    expect(missing.body.code).toBe(404);
  });

  it('石棺列表与详情可公开读取', async () => {
    const list = await request(app.getHttpServer()).get('/api/v1/visitor/coffins').expect(200);
    expect(Array.isArray(list.body.data.items)).toBe(true);
    expect(list.body.data.total).toBe(list.body.data.items.length);

    const first = list.body.data.items[0];
    expect(first).toBeTruthy();
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/visitor/coffins/${first.id}`)
      .expect(200);
    expect(detail.body.data.id).toBe(first.id);
    expect(Array.isArray(detail.body.data.images)).toBe(true);
    expect(Array.isArray(detail.body.data.models)).toBe(true);
  });

  it('全景只返回在线数据，草稿不可见', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/visitor/panoramas').expect(200);
    for (const item of res.body.data.items) {
      expect(item.status).toBe(1);
      expect(item.delFlag).toBe(0);
    }

    const prisma = app.get<{ bizPanorama: { findFirst: Function } }>(PrismaService);
    const draft = await prisma.bizPanorama.findFirst({
      where: { status: 0, delFlag: 0 },
      select: { id: true },
    });
    if (draft) {
      const missing = await request(app.getHttpServer())
        .get(`/api/v1/visitor/panoramas/${draft.id.toString()}`)
        .expect(404);
      expect(missing.body.code).toBe(404);
    }
  });

  it('公告只返回已发布数据', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/visitor/notices').expect(200);
    for (const item of res.body.data.items) {
      expect(item.status).toBe('published');
    }
  });
});
