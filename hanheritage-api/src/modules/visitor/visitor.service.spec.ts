import { VisitorService } from './visitor.service';

function createService(options: {
  cliffName?: string;
  coffinName?: string;
  panoramaName?: string;
} = {}) {
  const prisma = {
    bizCliff: {
      findUnique: jest.fn().mockResolvedValue(options.cliffName ? { name: options.cliffName } : null),
      update: jest.fn().mockResolvedValue({}),
    },
    bizCoffin: {
      findUnique: jest.fn().mockResolvedValue(options.coffinName ? { name: options.coffinName } : null),
      update: jest.fn().mockResolvedValue({}),
    },
    bizPanorama: {
      findUnique: jest
        .fn()
        .mockResolvedValue(options.panoramaName ? { name: options.panoramaName } : null),
      update: jest.fn().mockResolvedValue({}),
    },
    logOperation: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const onlineUserService = {
    touchVisitor: jest.fn(),
  };
  return {
    service: new VisitorService(prisma as any, onlineUserService as any),
    prisma,
    onlineUserService,
  };
}

describe('VisitorService 埋点', () => {
  it('崖墓浏览会累加浏览量并写入浏览日志', async () => {
    const { service, prisma, onlineUserService } = createService({ cliffName: '大耳朵崖墓群' });

    await expect(
      service.recordEvent({ event: 'cliff_view', page: 'cliff', targetId: '1' }, '1.2.3.4'),
    ).resolves.toEqual({ recorded: true });

    expect(prisma.bizCliff.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: { viewCount: { increment: 1 } },
    });
    expect(prisma.logOperation.create).toHaveBeenCalledWith({
      data: {
        operator: '游客',
        type: '浏览',
        targetId: '1',
        description: '游客浏览崖墓详情「大耳朵崖墓群」',
        method: 'POST',
        url: '/api/v1/visitor/cliff',
        ip: '1.2.3.4',
        status: 1,
      },
    });
    expect(onlineUserService.touchVisitor).not.toHaveBeenCalled();
  });

  it('石棺视图切换记为交互，并记录在线访客', async () => {
    const { service, prisma, onlineUserService } = createService({ coffinName: '05 号石棺' });

    await service.recordEvent(
      {
        event: 'coffin_stage_switch',
        page: 'coffin',
        targetId: '5',
        detail: '数字正射影像图',
        visitorId: 'visitor-1',
      },
      '10.0.0.8',
    );

    expect(prisma.bizCoffin.update).not.toHaveBeenCalled();
    expect(prisma.logOperation.create).toHaveBeenCalledWith({
      data: {
        operator: '游客',
        type: '交互',
        targetId: '5',
        description: '游客浏览石棺解读「05 号石棺」 · 数字正射影像图',
        method: 'POST',
        url: '/api/v1/visitor/coffin',
        ip: '10.0.0.8',
        status: 1,
      },
    });
    expect(onlineUserService.touchVisitor).toHaveBeenCalledWith(
      'visitor-1',
      '石棺解读',
      '10.0.0.8',
    );
  });

  it('全景浏览累加浏览量；非法目标 ID 不影响事件落库', async () => {
    const { service, prisma } = createService({ panoramaName: '博物馆大厅' });

    await service.recordEvent({ event: 'panorama_view', page: 'panorama', targetId: '1' });
    expect(prisma.bizPanorama.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: { viewCount: { increment: 1 } },
    });

    await expect(
      service.recordEvent({ event: 'cliff_view', page: 'cliff', targetId: 'not-a-number' }),
    ).resolves.toEqual({ recorded: true });
    expect(prisma.logOperation.create).toHaveBeenLastCalledWith({
      data: {
        operator: '游客',
        type: '浏览',
        targetId: 'not-a-number',
        description: '游客浏览崖墓详情',
        method: 'POST',
        url: '/api/v1/visitor/cliff',
        ip: undefined,
        status: 1,
      },
    });
  });
});
