import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  BIG_EAR_ENTRANCES,
  CLIFFS,
  COFFIN_TITLES,
  DEMO_PASSWORD,
  DEPTS,
  IMG_COFFIN,
  IMG_HALL,
  LOGIN_LOGS,
  MENUS,
  MODEL_URL,
  NOTICES,
  OPERATION_LOGS,
  PANORAMAS,
  PERMISSIONS,
  POSTS,
  RESOURCES,
  ROLES,
  USERS,
} from './seed-data';

const prisma = new PrismaClient();

async function clearDemoData() {
  await prisma.$transaction([
    prisma.logOperation.deleteMany(),
    prisma.logLogin.deleteMany(),
    prisma.bizCoffinImage.deleteMany(),
    prisma.bizCoffinModel.deleteMany(),
    prisma.bizCoffin.deleteMany(),
    prisma.bizEntrance.deleteMany(),
    prisma.bizCliff.deleteMany(),
    prisma.bizPanoramaHotspot.deleteMany(),
    prisma.bizPanoramaViewpoint.deleteMany(),
    prisma.bizPanorama.deleteMany(),
    prisma.bizResource.deleteMany(),
    prisma.sysNotice.deleteMany(),
    prisma.sysRolePermission.deleteMany(),
    prisma.sysRoleMenu.deleteMany(),
    prisma.sysUserPost.deleteMany(),
    prisma.sysUserRole.deleteMany(),
    prisma.sysUser.deleteMany(),
    prisma.sysMenu.deleteMany(),
    prisma.sysPost.deleteMany(),
    prisma.sysRole.deleteMany(),
    prisma.sysDept.deleteMany(),
  ]);
}

async function seedOrg(passwordHash: string) {
  for (const d of DEPTS) {
    await prisma.sysDept.create({
      data: {
        id: BigInt(d.id),
        name: d.name,
        parentId: d.parentId != null ? BigInt(d.parentId) : null,
        sort: d.sort,
        status: 1,
        delFlag: 0,
      },
    });
  }

  for (const r of ROLES) {
    await prisma.sysRole.create({
      data: {
        id: BigInt(r.id),
        name: r.name,
        code: r.code,
        dataScope: r.dataScope,
        sort: r.sort,
        parentId: r.parentId != null ? BigInt(r.parentId) : null,
        status: 1,
        delFlag: 0,
      },
    });
  }

  for (const p of POSTS) {
    await prisma.sysPost.create({
      data: {
        id: BigInt(p.id),
        name: p.name,
        code: p.code,
        sort: p.sort,
        parentId: p.parentId != null ? BigInt(p.parentId) : null,
        status: 1,
        delFlag: 0,
      },
    });
  }

  for (const m of MENUS) {
    await prisma.sysMenu.create({
      data: {
        id: BigInt(m.id),
        name: m.name,
        icon: m.icon,
        parentId: m.parentId != null ? BigInt(m.parentId) : null,
        path: m.path,
        component: m.component,
        sort: m.sort,
        type: m.type,
        perms: m.perms,
        status: 1,
        delFlag: 0,
      },
    });
  }

  for (const menu of MENUS) {
    await prisma.sysRoleMenu.create({
      data: { roleId: BigInt(1), menuId: BigInt(menu.id) },
    });
  }

  const BIZ_ADMIN_MENUS = [1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16, 23, 24];
  for (const menuId of BIZ_ADMIN_MENUS) {
    await prisma.sysRoleMenu.create({
      data: { roleId: BigInt(2), menuId: BigInt(menuId) },
    });
  }

  const EDITOR_MENUS = [1, 2, 3, 5, 6, 7, 23, 24];
  for (const menuId of EDITOR_MENUS) {
    await prisma.sysRoleMenu.create({
      data: { roleId: BigInt(3), menuId: BigInt(menuId) },
    });
  }

  const GUEST_MENUS = [1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16, 23, 24];
  for (const menuId of GUEST_MENUS) {
    await prisma.sysRoleMenu.create({
      data: { roleId: BigInt(4), menuId: BigInt(menuId) },
    });
  }

  for (const r of ROLES) {
    if (!r.permissionIds) continue;
    for (const permId of r.permissionIds) {
      await prisma.sysRolePermission.create({
        data: { roleId: BigInt(r.id), permissionId: permId },
      });
    }
  }

  for (const p of POSTS) {
    if (!p.permissionIds) continue;
    for (const permId of p.permissionIds) {
      await prisma.sysPostPermission.create({
        data: { postId: BigInt(p.id), permissionId: permId },
      });
    }
  }

  for (const u of USERS) {
    await prisma.sysUser.create({
      data: {
        id: BigInt(u.id),
        account: u.account,
        password: passwordHash,
        name: u.name,
        phone: u.phone,
        deptId: BigInt(u.deptId),
        status: u.status,
        delFlag: 0,
      },
    });
    for (const roleId of u.roleIds) {
      await prisma.sysUserRole.create({
        data: { userId: BigInt(u.id), roleId: BigInt(roleId) },
      });
    }
    for (const postId of u.postIds) {
      await prisma.sysUserPost.create({
        data: { userId: BigInt(u.id), postId: BigInt(postId) },
      });
    }
  }
}

async function seedBusiness() {
  for (let i = 0; i < CLIFFS.length; i++) {
    const c = CLIFFS[i];
    await prisma.bizCliff.create({
      data: {
        id: BigInt(i + 1),
        code: c.code,
        name: c.name,
        lng: c.lng,
        lat: c.lat,
        area: c.area,
        level: c.level,
        category: c.category,
        dynasty: c.dynasty,
        description: c.description,
        status: 1,
        delFlag: 0,
      },
    });
  }

  for (const e of BIG_EAR_ENTRANCES) {
    await prisma.bizEntrance.create({
      data: {
        cliffId: BigInt(5),
        direction: e.direction,
        intro: e.intro,
      },
    });
  }

  for (let i = 0; i < COFFIN_TITLES.length; i++) {
    const grade =
      i < 5 ? 'first' : i < 15 ? 'second' : 'third';
    await prisma.bizCoffin.create({
      data: {
        id: BigInt(i + 1),
        code: `CF-${String(i + 1).padStart(2, '0')}`,
        name: COFFIN_TITLES[i],
        cliffId: BigInt(5),
        dynasty: 'han',
        grade,
        source: 'excavation',
        completeness: 'complete',
        dimensions: '长210cm，宽75cm，高85cm',
        texture: '红砂岩',
        description: `${COFFIN_TITLES[i]}，1987年大耳朵崖墓群出土。`,
        thumbnail: i % 2 ? IMG_HALL : IMG_COFFIN,
        status: 1,
        delFlag: 0,
      },
    });
  }

  const imageTypes = ['ortho', 'rubbing', 'line', 'enhance'] as const;
  for (let coffinId = 1; coffinId <= 3; coffinId++) {
    for (let sort = 0; sort < imageTypes.length; sort++) {
      await prisma.bizCoffinImage.create({
        data: {
          coffinId: BigInt(coffinId),
          imageUrl: sort % 2 ? IMG_HALL : IMG_COFFIN,
          imageType: imageTypes[sort],
          sort,
        },
      });
    }
    await prisma.bizCoffinModel.create({
      data: {
        coffinId: BigInt(coffinId),
        modelUrl: MODEL_URL,
        format: 'glb',
        fileSize: 5242880,
      },
    });
  }

  for (const p of PANORAMAS) {
    await prisma.bizPanorama.create({
      data: {
        id: BigInt(p.id),
        name: p.name,
        category: p.category,
        imageUrl: p.imageUrl,
        status: p.status,
        delFlag: 0,
      },
    });
  }

  for (const r of RESOURCES) {
    await prisma.bizResource.create({
      data: {
        id: BigInt(r.id),
        name: r.name,
        type: r.type,
        parentId: r.parentId != null ? BigInt(r.parentId) : null,
        fileUrl: r.fileUrl ?? undefined,
        fileSize: r.fileSize,
        delFlag: 0,
      },
    });
  }

  for (const n of NOTICES) {
    await prisma.sysNotice.create({
      data: {
        id: BigInt(n.id),
        title: n.title,
        content: n.content,
        contentHtml: n.contentHtml,
        type: n.type,
        scope: n.scope,
        status: n.status,
        publishedAt: n.publishedAt ? new Date(n.publishedAt) : null,
        createdBy: 'admin',
      },
    });
  }

  for (const row of OPERATION_LOGS) {
    await prisma.logOperation.create({
      data: {
        operator: row.operator,
        operateTime: new Date(row.operateTime),
        type: row.type,
        description: row.description,
        method: row.method,
        url: row.url,
        status: row.status,
        ip: row.ip,
      },
    });
  }

  for (const row of LOGIN_LOGS) {
    await prisma.logLogin.create({
      data: {
        username: row.username,
        loginTime: new Date(row.loginTime),
        ip: row.ip,
        os: row.os,
        browser: row.browser,
        success: row.success,
        failReason: 'failReason' in row ? row.failReason : undefined,
      },
    });
  }
}

async function main() {
  console.log('Clearing existing demo data...');
  await clearDemoData();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  console.log('Seeding organization & permissions...');
  await seedOrg(passwordHash);

  console.log('Seeding business demo data...');
  await seedBusiness();

  console.log('Demo seed completed.');
  console.log(`Login: admin / ${DEMO_PASSWORD} (zhangsan, lisi same password)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
