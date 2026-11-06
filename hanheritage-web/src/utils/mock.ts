import { users, roles, depts, posts, loginLogs, onlineUsers, defaultNotices, defaultMenuTree, CLIFF_BASE } from '@/data/admin-store'
import { CLIFF_MARKERS, FALLBACK_IMAGES } from '@/data/cliff-data'
import { COFFIN_TITLES } from '@/data/admin-store'

const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function mockRequest<T>(data: T, delayMs: number = 300): Promise<T> {
  await delay(delayMs)
  return data
}

export const mockAuth = {
  login: async (data: { username: string; password: string }) => {
    if (data.username === 'admin' && data.password === 'admin') {
      return mockRequest({
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      })
    }
    throw new Error('用户名或密码错误')
  },

  getUserInfo: async () => {
    return mockRequest({
      id: 'u1',
      username: 'admin',
      account: 'admin',
      realName: '系统管理员',
      name: '系统管理员',
      phone: '13800000001',
      email: '',
      deptId: 'd3',
      dept: { id: 'd3', name: '信息中心' },
      roleIds: ['r1'],
      roles: [{ id: 'r1', name: '系统管理员', code: 'SYS_ADMIN' }],
      postIds: ['p1'],
      deptName: '信息中心',
      roleNames: '系统管理员',
      createdAt: '2026-01-15T10:00:00.000Z',
      menus: [
        { id: '1', name: '工作台', icon: 'home-filled', path: null, component: null, parentId: null, type: 'dir', sort: 0, perms: null },
        { id: '2', name: '首页概览', icon: 'home-filled', path: '/admin/dashboard', component: 'dashboard/index', parentId: '1', type: 'menu', sort: 0, perms: 'dashboard:list' },
        { id: '3', name: '业务数据', icon: 'data-board', path: null, component: null, parentId: null, type: 'dir', sort: 1, perms: null },
        { id: '4', name: '崖墓管理', icon: 'map-location', path: '/admin/cliff', component: 'cliff/index', parentId: '3', type: 'menu', sort: 0, perms: 'cliff:list' },
        { id: '5', name: '石棺管理', icon: 'box', path: '/admin/coffin', component: 'coffin/index', parentId: '3', type: 'menu', sort: 1, perms: 'coffin:list' },
        { id: '6', name: '博物馆全景管理', icon: 'picture', path: '/admin/panorama', component: 'museum/index', parentId: '3', type: 'menu', sort: 2, perms: 'panorama:list' },
        { id: '7', name: '资源管理', icon: 'folder-opened', path: '/admin/resource', component: 'resource/index', parentId: '3', type: 'menu', sort: 3, perms: 'resource:list' },
        { id: '8', name: '组织与权限', icon: 'user-filled', path: null, component: null, parentId: null, type: 'dir', sort: 2, perms: null },
        { id: '9', name: '用户管理', icon: 'user', path: '/admin/user', component: 'system/user/index', parentId: '8', type: 'menu', sort: 0, perms: 'system:user:list' },
        { id: '10', name: '角色管理', icon: 'key', path: '/admin/role', component: 'system/role/index', parentId: '8', type: 'menu', sort: 1, perms: 'system:role:list' },
        { id: '11', name: '部门管理', icon: 'office-building', path: '/admin/dept', component: 'system/dept/index', parentId: '8', type: 'menu', sort: 2, perms: 'system:dept:list' },
        { id: '12', name: '岗位管理', icon: 'suitcase', path: '/admin/post', component: 'system/post/index', parentId: '8', type: 'menu', sort: 3, perms: 'system:post:list' },
        { id: '13', name: '日志与在线', icon: 'list', path: null, component: null, parentId: null, type: 'dir', sort: 3, perms: null },
        { id: '14', name: '操作日志', icon: 'notebook', path: '/admin/log-operation', component: 'monitor/operlog/index', parentId: '13', type: 'menu', sort: 0, perms: 'monitor:operlog:list' },
        { id: '15', name: '登录日志', icon: 'alarm-clock', path: '/admin/log-login', component: 'monitor/logininfor/index', parentId: '13', type: 'menu', sort: 1, perms: 'monitor:logininfor:list' },
        { id: '16', name: '在线用户', icon: 'connection', path: '/admin/online-users', component: 'monitor/online/index', parentId: '13', type: 'menu', sort: 2, perms: 'monitor:online:list' },
        { id: '17', name: '运维监控', icon: 'monitor', path: null, component: null, parentId: null, type: 'dir', sort: 4, perms: null },
        { id: '18', name: '服务监控', icon: 'cpu', path: '/admin/monitor-jvm', component: 'monitor/server/index', parentId: '17', type: 'menu', sort: 0, perms: 'monitor:server:list' },
        { id: '19', name: '缓存监控', icon: 'coin', path: '/admin/monitor-redis', component: 'monitor/cache/index', parentId: '17', type: 'menu', sort: 1, perms: 'monitor:cache:list' },
        { id: '20', name: '系统配置', icon: 'setting', path: null, component: null, parentId: null, type: 'dir', sort: 5, perms: null },
        { id: '21', name: '菜单管理', icon: 'menu', path: '/admin/menu', component: 'system/menu/index', parentId: '20', type: 'menu', sort: 0, perms: 'system:menu:list' },
        { id: '22', name: '通知公告', icon: 'bell', path: '/admin/notice', component: 'system/notice/index', parentId: '20', type: 'menu', sort: 1, perms: 'system:notice:list' },
        { id: '23', name: '账户', icon: 'avatar', path: null, component: null, parentId: null, type: 'dir', sort: 6, perms: null },
        { id: '24', name: '个人信息', icon: 'user-filled', path: '/admin/profile', component: 'system/profile/index', parentId: '23', type: 'menu', sort: 0, perms: 'system:profile:view' },
      ],
      permissions: [
        'dashboard:list', 'cliff:list', 'coffin:list', 'panorama:list', 'resource:list',
        'system:user:list', 'system:role:list', 'system:dept:list', 'system:post:list',
        'monitor:operlog:list', 'monitor:logininfor:list', 'monitor:online:list',
        'monitor:server:list', 'monitor:cache:list',
        'system:menu:list', 'system:notice:list', 'system:profile:view',
      ],
    })
  },

  logout: async () => {
    return mockRequest({ success: true })
  },

  refreshToken: async () => {
    return mockRequest({ token: 'mock-jwt-token-refreshed-' + Date.now() })
  },

  updatePassword: async (data: { oldPassword: string; newPassword: string }) => {
    return mockRequest({ success: true })
  },
}

export const mockSystem = {
  getUserList: async () => {
    return mockRequest({ list: users, total: users.length })
  },

  getUserDetail: async (id: string) => {
    const user = users.find(u => u.id === id)
    return mockRequest(user || {})
  },

  createUser: async (data: any) => {
    const newUser = { ...data, id: 'u' + Date.now() }
    return mockRequest(newUser)
  },

  updateUser: async (id: string, data: any) => {
    return mockRequest({ ...data, id })
  },

  deleteUser: async () => {
    return mockRequest({ success: true })
  },

  getRoleList: async () => {
    return mockRequest({ list: roles, total: roles.length })
  },

  createRole: async (data: any) => {
    return mockRequest({ ...data, id: 'r' + Date.now() })
  },

  updateRole: async (id: string, data: any) => {
    return mockRequest({ ...data, id })
  },

  deleteRole: async () => {
    return mockRequest({ success: true })
  },

  getDeptTree: async () => {
    return mockRequest(depts)
  },

  getMenuTree: async () => {
    return mockRequest(defaultMenuTree)
  },

  getNoticeList: async () => {
    return mockRequest({ list: defaultNotices, total: defaultNotices.length })
  },

  getLoginLogs: async () => {
    return mockRequest({ list: loginLogs, total: loginLogs.length })
  },

  getOnlineUsers: async () => {
    return mockRequest({ list: onlineUsers, total: onlineUsers.length })
  },

  getServerInfo: async () => {
    return mockRequest({
      cpu: Math.floor(Math.random() * 30) + 10,
      memory: Math.floor(Math.random() * 40) + 30,
      disk: Math.floor(Math.random() * 20) + 60,
      uptime: '2天 18小时 32分',
    })
  },

  getRedisInfo: async () => {
    return mockRequest({
      usedMemory: '256 MB',
      keys: 1280,
      hits: 98500,
      misses: 1500,
    })
  },
}

export const mockCliff = {
  getCliffList: async () => {
    const cliffs = CLIFF_BASE.map((c, index) => ({
      id: String(index + 1),
      code: 'CM-' + String(index + 1).padStart(2, '0'),
      ...c,
      createdAt: '2026-03-15 10:00',
      updatedAt: '2026-03-20 15:30',
    }))
    return mockRequest({ list: cliffs, total: cliffs.length })
  },

  getCliffDetail: async (id: string) => {
    const cliff = CLIFF_BASE.find((_, index) => String(index + 1) === id)
    if (!cliff) return mockRequest({})
    
    return mockRequest({
      id,
      code: 'CM-' + id.padStart(2, '0'),
      ...cliff,
      entrances: [
        { id: 'e1', code: 'M1', name: '墓口1', status: 'normal' },
        { id: 'e2', code: 'M2', name: '墓口2', status: 'normal' },
        { id: 'e3', code: 'M3', name: '墓口3', status: 'damaged' },
      ],
      images: FALLBACK_IMAGES,
    })
  },

  createCliff: async (data: any) => {
    return mockRequest({ ...data, id: 'c' + Date.now() })
  },

  updateCliff: async (id: string, data: any) => {
    return mockRequest({ ...data, id })
  },

  deleteCliff: async (id: any) => {
    return mockRequest({ success: true })
  },

  getEntrances: async (cliffId: string) => {
    return mockRequest([
      { id: 'e1', code: 'M1', name: '墓口1', status: 'normal', description: '保存完好' },
      { id: 'e2', code: 'M2', name: '墓口2', status: 'normal', description: '保存完好' },
      { id: 'e3', code: 'M3', name: '墓口3', status: 'damaged', description: '局部损坏' },
      { id: 'e4', code: 'M4', name: '墓口4', status: 'normal', description: '保存完好' },
      { id: 'e5', code: 'M5', name: '墓口5', status: 'restored', description: '已修复' },
      { id: 'e6', code: 'M6', name: '墓口6', status: 'normal', description: '保存完好' },
    ])
  },

  createEntrance: async (cliffId: string, data: any) => {
    return mockRequest({ id: 'e' + Date.now(), code: 'M' + Date.now(), name: '新墓口', status: 'normal', ...data })
  },
}

export const mockCoffin = {
  getCoffinList: async () => {
    const coffins = COFFIN_TITLES.map((title, index) => ({
      id: String(index + 1),
      code: 'CF-' + String(index + 1).padStart(2, '0'),
      title,
      tombGroup: '大耳朵崖墓群',
      era: '东汉',
      relicGrade: index < 5 ? '一级文物' : index < 15 ? '二级文物' : '三级文物',
      createdAt: '2026-03-01 09:00',
    }))
    return mockRequest({ list: coffins, total: coffins.length })
  },

  getCoffinDetail: async (id: string) => {
    const index = parseInt(id) - 1
    const title = COFFIN_TITLES[index] || '石棺'
    
    return mockRequest({
      id,
      code: 'CF-' + id.padStart(2, '0'),
      title,
      tombGroup: '大耳朵崖墓群',
      eraCategory: '东汉',
      dynasty: '汉',
      eraSpecific: '东汉晚期',
      artifactCategory: '葬具',
      textureType: '石质',
      materialCategory: '砂岩',
      materialSpecific: '红砂岩',
      quantity: 1,
      dimLength: 210,
      dimWidth: 75,
      dimHeight: 85,
      dimText: '长210cm，宽75cm，高85cm',
      relicGrade: index < 5 ? '一级文物' : index < 15 ? '二级文物' : '三级文物',
      sourceType: '考古发掘',
      sourceDetail: '1987年大耳朵崖墓群M3出土',
      completeness: '完整',
      completenessDetail: '保存完好，局部有轻微风化',
      preservationStatus: '良好',
      images: [
        '/prototype/assets/coffin-detail-1.png',
        '/prototype/assets/coffin-detail-2.png',
        '/prototype/assets/coffin-detail-3.png',
      ],
      modelUrl: '',
    })
  },

  createCoffin: async (data: any) => {
    return mockRequest({ ...data, id: 'cf' + Date.now() })
  },

  updateCoffin: async (id: string, data: any) => {
    return mockRequest({ ...data, id })
  },

  deleteCoffin: async (id: any) => {
    return mockRequest({ success: true })
  },
}

export const mockPanorama = {
  getPanoramaList: async () => {
    return mockRequest({
      list: [
        { id: 'p1', name: '博物馆大厅', category: 'inner', status: 'published', createdAt: '2026-03-10' },
        { id: 'p2', name: '石棺展厅', category: 'inner', status: 'published', createdAt: '2026-03-12' },
        { id: 'p3', name: '大耳朵崖墓群外景', category: 'ground', status: 'published', createdAt: '2026-03-15' },
        { id: 'p4', name: '墓口内部全景', category: 'inner', status: 'draft', createdAt: '2026-03-18' },
        { id: 'p5', name: '航拍全景', category: 'air', status: 'published', createdAt: '2026-03-20' },
      ],
      total: 5,
    })
  },

  createPanorama: async (data: any) => {
    return mockRequest({ ...data, id: 'p' + Date.now() })
  },

  updatePanorama: async (id: string, data: any) => {
    return mockRequest({ ...data, id })
  },

  deletePanorama: async (id: any) => {
    return mockRequest({ success: true })
  },
}

export const mockResource = {
  getResourceList: async () => {
    const types = ['doc', 'image', 'model', 'scan', 'pointcloud', 'deliverable', 'video']
    const names = ['文档', '图片', '模型', '扫描', '点云', '成果', '视频']
    
    const resources = Array.from({ length: 20 }, (_, i) => ({
      id: 'res' + (i + 1),
      name: `${names[i % 7]}资源${Math.floor(i / 7) + 1}`,
      type: types[i % 7],
      size: Math.floor(Math.random() * 1000) + 50 + ' MB',
      createdAt: '2026-03-' + String(10 + (i % 15)).padStart(2, '0'),
    }))
    
    return mockRequest({ list: resources, total: 156 })
  },

  createResource: async (data: any) => {
    return mockRequest({ ...data, id: 'res' + Date.now() })
  },

  deleteResource: async (id: any) => {
    return mockRequest({ success: true })
  },
}

export const mockVisitor = {
  getCliffMarkers: async () => {
    return mockRequest(CLIFF_MARKERS)
  },

  getCliffById: async (id: number) => {
    const cliff = CLIFF_MARKERS.find(c => c.id === id)
    if (!cliff) return mockRequest(null)
    
    const base = CLIFF_BASE.find((_, index) => index === id - 1) || CLIFF_BASE[0]
    return mockRequest({
      ...cliff,
      ...base,
      images: FALLBACK_IMAGES,
      modelUrl: '',
    })
  },
}

export function createApiProxy<T extends Record<string, any>>(realApi: T, mockApi: T): T {
  if (!isLocalMode) {
    return realApi
  }
  
  const proxy: Record<string, any> = {}
  for (const key of Object.keys(mockApi as object)) {
    proxy[key] = (mockApi as Record<string, any>)[key]
  }
  return proxy as T
}

export { isLocalMode }
