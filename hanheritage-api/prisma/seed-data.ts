/** Demo seed data — aligned with hanheritage-web mock / admin-store */

export const DEMO_PASSWORD = 'admin';

export const CLIFFS: Array<{
  code: string;
  name: string;
  lng?: number;
  lat?: number;
  area?: number;
  level?: string;
  category?: string;
  dynasty?: string;
  description?: string;
}> = [
  { code: 'CM-01', name: '洞溪崖墓群', dynasty: '东汉', category: 'ordinary', level: 'county' },
  { code: 'CM-02', name: '黄溪侯五墙崖墓群', dynasty: '东汉', category: 'ordinary', level: 'county' },
  { code: 'CM-03', name: '芭蕉湾崖墓群', dynasty: '东汉', category: 'ordinary', level: 'city' },
  { code: 'CM-04', name: '蒋湾和幸福崖墓群', dynasty: '东汉', category: 'ordinary', level: 'city' },
  {
    code: 'CM-05',
    name: '大耳朵崖墓群',
    lng: 105.83458,
    lat: 28.82576,
    area: 296,
    level: 'national',
    category: 'ordinary',
    dynasty: '东汉',
    description:
      '<p>大耳朵崖墓群分布于红砂岩崖壁，为东汉时期崖洞式墓葬。2013 年公布为全国重点文物保护单位。葬具见画像石棺、石筑墓室及建筑构件等。</p>',
  },
  { code: 'CM-06', name: '魏家祠崖墓群', dynasty: '东汉', category: 'ordinary', level: 'provincial' },
  { code: 'CM-07', name: '观音岩崖墓群', dynasty: '东汉', category: 'ordinary', level: 'city' },
  { code: 'CM-08', name: '渔链子崖墓群', dynasty: '东汉', category: 'ordinary', level: 'city' },
  { code: 'CM-09', name: '大路边崖墓群', dynasty: '东汉', category: 'ordinary', level: 'county' },
  { code: 'CM-10', name: '佛子岩崖墓群', dynasty: '东汉', category: 'ordinary', level: 'county' },
  { code: 'CM-11', name: '鱼天堂崖墓群', dynasty: '东汉', category: 'ordinary', level: 'provincial' },
  { code: 'CM-12', name: '高村崖墓群', dynasty: '东汉', category: 'ordinary', level: 'county' },
  { code: 'CM-13', name: '梭滩石崖墓群', dynasty: '东汉', category: 'ordinary', level: 'county' },
];

export const BIG_EAR_ENTRANCES = [
  { direction: 'M1', intro: '墓口1，保存完好' },
  { direction: 'M2', intro: '墓口2，保存完好' },
  { direction: 'M3', intro: '墓口3，局部损坏' },
  { direction: 'M4', intro: '墓口4，保存完好' },
  { direction: 'M5', intro: '墓口5，已修复' },
  { direction: 'M6', intro: '墓口6，保存完好' },
];

export const COFFIN_TITLES = [
  '1号棺（东汉羿求药图画像石棺）',
  '2号棺（东汉伏羲女娲图画像石棺）',
  '3号棺（东汉双阙迎宾画像石棺）',
  '4号棺（东汉车临天门画像石棺）',
  '5号棺（东汉车马巡行画像石棺）',
  '6号棺（东汉宴乐百戏画像石棺）',
  '7号棺（东汉神农采药画像石棺）',
  '8号棺（东汉东王公西王母画像石棺）',
  '9号棺（东汉青龙白虎画像石棺）',
  '10号棺（东汉夫妻宴享图画像石棺）',
  '11号棺（东汉庖厨酿酒画像石棺）',
  '12号棺（东汉乐舞杂技画像石棺）',
  '13号棺（东汉狩猎图画像石棺）',
  '14号棺（东汉楼阁人物画像石棺）',
  '15号棺（东汉仙境图画像石棺）',
  '16号棺（东汉四神画像石棺）',
  '17号棺（东汉门吏铺首画像石棺）',
  '18号棺（东汉瑞兽祥禽画像石棺）',
  '19号棺（东汉升仙图画像石棺）',
  '32号棺（东汉燕居画像石棺）',
  '33号棺（牛郎织女·七星北斗画像石棺）',
  '22号棺（东汉武库兵器画像石棺）',
  '23号棺（东汉求药图画像石棺）',
  '24号棺（东汉龟鹤延年画像石棺）',
  '25号棺（东汉五君子戏虎画像石棺）',
  '26号棺（东汉五君子戏虎画像石棺）',
  '27号棺（东汉西王母炼丹画像石棺）',
  '棺盖（东汉莲蓬·柿蒂纹·钱币纹棺盖）',
];

export const DEPTS = [
  { id: 1, name: '合江崖墓数字化项目组', parentId: null as number | null, sort: 1 },
  { id: 2, name: '博物馆', parentId: 1, sort: 1 },
  { id: 3, name: '信息中心', parentId: 2, sort: 1 },
  { id: 4, name: '展教部', parentId: 2, sort: 2 },
];

export const PERMISSIONS = [
  { id: 'm1', label: '系统管理（用户/角色/部门/岗位）' },
  { id: 'm2', label: '崖墓与墓口台账' },
  { id: 'm3', label: '石棺与文物资源' },
  { id: 'm4', label: '多媒体与全景' },
  { id: 'm5', label: '日志与审计（只读）' },
];

export const ROLES = [
  { id: 1, name: '系统管理员', code: 'SYS_ADMIN', dataScope: 'all', parentId: null as number | null, sort: 1, permissionIds: ['m1', 'm2', 'm3', 'm4', 'm5'] },
  { id: 2, name: '业务管理员', code: 'BIZ_ADMIN', dataScope: 'dept', parentId: 1, sort: 2, permissionIds: ['m2', 'm3', 'm4'] },
  { id: 3, name: '内容编辑', code: 'EDITOR', dataScope: 'dept', parentId: 2, sort: 3, permissionIds: ['m3', 'm4'] },
  { id: 4, name: '访客角色', code: 'GUEST', dataScope: 'all', parentId: null as number | null, sort: 4, permissionIds: ['m5'] },
];

export const POSTS = [
  { id: 1, name: '馆长', code: 'director', parentId: null as number | null, sort: 1, permissionIds: ['m1', 'm2', 'm3', 'm4', 'm5'] },
  { id: 2, name: '副馆长', code: 'vice_director', parentId: 1, sort: 2, permissionIds: ['m2', 'm3', 'm4'] },
  { id: 3, name: '展教专员', code: 'edu_staff', parentId: 2, sort: 3, permissionIds: ['m3', 'm5'] },
];

export const USERS = [
  { id: 1, account: 'admin', name: '系统管理员', phone: '13800000001', deptId: 3, status: 1, roleIds: [1], postIds: [1] },
  { id: 2, account: 'zhangsan', name: '张三', phone: '13800000002', deptId: 4, status: 1, roleIds: [3], postIds: [3] },
  { id: 3, account: 'lisi', name: '李四', phone: '13800000003', deptId: 2, status: 0, roleIds: [2, 4], postIds: [2] },
];

export const MENUS: Array<{
  id: number;
  parentId: number | null;
  name: string;
  icon?: string;
  path?: string;
  component?: string;
  sort: number;
  type: string;
  perms?: string;
}> = [
  { id: 1, parentId: null, name: '工作台', icon: 'home-filled', sort: 0, type: 'dir' },
  { id: 2, parentId: 1, name: '首页概览', icon: 'home-filled', path: '/admin/dashboard', component: 'dashboard/index', sort: 0, type: 'menu', perms: 'dashboard:list' },
  { id: 3, parentId: null, name: '业务数据', icon: 'data-board', sort: 1, type: 'dir' },
  { id: 4, parentId: 3, name: '崖墓管理', icon: 'map-location', path: '/admin/cliff', component: 'cliff/index', sort: 0, type: 'menu', perms: 'cliff:list' },
  { id: 5, parentId: 3, name: '石棺管理', icon: 'box', path: '/admin/coffin', component: 'coffin/index', sort: 1, type: 'menu', perms: 'coffin:list' },
  { id: 6, parentId: 3, name: '博物馆全景管理', icon: 'picture', path: '/admin/panorama', component: 'museum/index', sort: 2, type: 'menu', perms: 'panorama:list' },
  { id: 7, parentId: 3, name: '资源管理', icon: 'folder-opened', path: '/admin/resource', component: 'resource/index', sort: 3, type: 'menu', perms: 'resource:list' },
  { id: 8, parentId: null, name: '组织与权限', icon: 'user-filled', sort: 2, type: 'dir' },
  { id: 9, parentId: 8, name: '用户管理', icon: 'user', path: '/admin/user', component: 'system/user/index', sort: 0, type: 'menu', perms: 'system:user:list' },
  { id: 10, parentId: 8, name: '角色管理', icon: 'key', path: '/admin/role', component: 'system/role/index', sort: 1, type: 'menu', perms: 'system:role:list' },
  { id: 11, parentId: 8, name: '部门管理', icon: 'office-building', path: '/admin/dept', component: 'system/dept/index', sort: 2, type: 'menu', perms: 'system:dept:list' },
  { id: 12, parentId: 8, name: '岗位管理', icon: 'suitcase', path: '/admin/post', component: 'system/post/index', sort: 3, type: 'menu', perms: 'system:post:list' },
  { id: 13, parentId: null, name: '日志与在线', icon: 'list', sort: 3, type: 'dir' },
  { id: 14, parentId: 13, name: '操作日志', icon: 'notebook', path: '/admin/log-operation', component: 'monitor/operlog/index', sort: 0, type: 'menu', perms: 'monitor:operlog:list' },
  { id: 15, parentId: 13, name: '登录日志', icon: 'alarm-clock', path: '/admin/log-login', component: 'monitor/logininfor/index', sort: 1, type: 'menu', perms: 'monitor:logininfor:list' },
  { id: 16, parentId: 13, name: '在线用户', icon: 'connection', path: '/admin/online-user', component: 'monitor/online/index', sort: 2, type: 'menu', perms: 'monitor:online:list' },
  { id: 17, parentId: null, name: '运维监控', icon: 'monitor', sort: 4, type: 'dir' },
  { id: 18, parentId: 17, name: '服务监控', icon: 'cpu', path: '/admin/monitor-jvm', component: 'monitor/server/index', sort: 0, type: 'menu', perms: 'monitor:server:list' },
  { id: 19, parentId: 17, name: '缓存监控', icon: 'coin', path: '/admin/monitor-redis', component: 'monitor/cache/index', sort: 1, type: 'menu', perms: 'monitor:cache:list' },
  { id: 20, parentId: null, name: '系统配置', icon: 'setting', sort: 5, type: 'dir' },
  { id: 21, parentId: 20, name: '菜单管理', icon: 'menu', path: '/admin/menu', component: 'system/menu/index', sort: 0, type: 'menu', perms: 'system:menu:list' },
  { id: 22, parentId: 20, name: '通知公告', icon: 'bell', path: '/admin/notice', component: 'system/notice/index', sort: 1, type: 'menu', perms: 'system:notice:list' },
  { id: 23, parentId: null, name: '账户', icon: 'avatar', sort: 6, type: 'dir' },
  { id: 24, parentId: 23, name: '个人信息', icon: 'user-filled', path: '/admin/profile', component: 'system/profile/index', sort: 0, type: 'menu', perms: 'system:profile:view' },
];

export const PANORAMAS = [
  { id: 1, name: '博物馆大厅', category: 'inner', imageUrl: '/prototype/assets/pano-museum-indoor-hall.png', status: 1 },
  { id: 2, name: '石棺展厅', category: 'inner', imageUrl: '/prototype/assets/pano-museum-indoor-coffin.png', status: 1 },
  { id: 3, name: '大耳朵崖墓群外景', category: 'ground', imageUrl: '/prototype/assets/hejiang-han-cliff-distribution.png', status: 1 },
  { id: 4, name: '墓口内部全景', category: 'inner', imageUrl: '/prototype/assets/pano-museum-indoor-coffin.png', status: 0 },
  { id: 5, name: '航拍全景', category: 'air', imageUrl: '/prototype/assets/hejiang-han-cliff-distribution.png', status: 1 },
];

export const RESOURCES = [
  { id: 1, parentId: null as number | null, name: '崖墓数字化成果', type: 'folder', fileUrl: null, fileSize: 0 },
  { id: 2, parentId: 1, name: '大耳朵崖墓群', type: 'folder', fileUrl: null, fileSize: 0 },
  { id: 3, parentId: 2, name: '分布图.png', type: 'image', fileUrl: '/prototype/assets/hejiang-han-cliff-distribution.png', fileSize: 2048000 },
  { id: 4, parentId: null, name: '石棺三维模型', type: 'folder', fileUrl: null, fileSize: 0 },
  { id: 5, parentId: 4, name: 'coffin_m1.glb', type: 'model', fileUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', fileSize: 5242880 },
  { id: 6, parentId: 4, name: 'coffin_m2.glb', type: 'model', fileUrl: 'https://modelviewer.dev/shared-assets/models/Horse.glb', fileSize: 4194304 },
  { id: 7, parentId: null, name: '扫描与点云', type: 'folder', fileUrl: null, fileSize: 0 },
  { id: 8, parentId: 7, name: 'M3墓口点云.las', type: 'pointcloud', fileUrl: null, fileSize: 104857600 },
];

export const NOTICES = [
  {
    id: 1,
    title: '系统维护通知',
    content: '计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。',
    contentHtml: '<p>计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。</p>',
    type: 'notice',
    scope: 'all',
    status: 'published',
    publishedAt: '2026-05-22',
  },
  {
    id: 2,
    title: '内部培训（草稿）',
    content: '新员工平台使用培训，时间待定。',
    contentHtml: '<p>新员工平台使用培训，时间待定。</p>',
    type: 'notice',
    scope: 'all',
    status: 'draft',
  },
];

export const OPERATION_LOGS = [
  { operator: '系统管理员', operateTime: '2026-04-07 09:05:00', type: '编辑', description: '更新「大耳朵崖墓群」台账', method: 'PUT', url: '/api/v1/cliffs/5', status: 1, ip: '10.0.0.12' },
  { operator: '张三', operateTime: '2026-04-07 09:18:00', type: '上传', description: '模型文件 coffin_m2.glb', method: 'POST', url: '/api/v1/coffins/2/resources', status: 1, ip: '10.0.0.15' },
  { operator: '系统管理员', operateTime: '2026-04-07 09:42:00', type: '新增', description: '新增用户：王五', method: 'POST', url: '/api/v1/users', status: 1, ip: '10.0.0.12' },
  { operator: '李四', operateTime: '2026-04-07 10:15:00', type: '查看', description: '查看崖墓详情', method: 'GET', url: '/api/v1/cliffs/5', status: 1, ip: '10.0.0.18' },
  { operator: '系统管理员', operateTime: '2026-04-07 11:02:00', type: '删除', description: '删除过期通知公告', method: 'DELETE', url: '/api/v1/notices/3', status: 1, ip: '10.0.0.12' },
  { operator: '李四', operateTime: '2026-04-07 10:01:00', type: '删除', description: '删除文件夹「临时扫描」', method: 'DELETE', url: '/api/v1/resources/99', status: 1, ip: '192.168.1.88' },
  { operator: '系统管理员', operateTime: '2026-04-06 16:30:00', type: '编辑', description: '调整角色「内容编辑」权限', method: 'PUT', url: '/api/v1/roles/3', status: 1, ip: '10.0.0.12' },
  { operator: '张三', operateTime: '2026-04-06 14:20:00', type: '查看', description: '打开全景配置', method: 'GET', url: '/api/v1/panoramas/2', status: 1, ip: '10.0.0.15' },
  { operator: '王五', operateTime: '2026-04-05 11:00:00', type: '发布', description: '发布「清明开放公告」', method: 'POST', url: '/api/v1/notices', status: 1, ip: '192.168.2.3' },
  { operator: '系统管理员', operateTime: '2026-04-04 09:00:00', type: '编辑', description: '调整侧栏菜单排序', method: 'PUT', url: '/api/v1/menus/3', status: 1, ip: '10.0.0.12' },
];

export const LOGIN_LOGS = [
  { username: 'admin', loginTime: '2026-04-07 08:58:00', ip: '10.0.0.12', os: 'Windows 11', browser: 'Chrome 131', success: 1 },
  { username: 'zhangsan', loginTime: '2026-04-07 09:02:00', ip: '10.0.0.15', os: 'Windows 11', browser: 'Edge 130', success: 1 },
  { username: 'guest', loginTime: '2026-04-07 08:50:00', ip: '192.168.1.20', os: 'Windows 10', browser: 'Chrome 130', success: 0, failReason: '密码错误' },
  { username: 'lisi', loginTime: '2026-04-06 18:00:00', ip: '192.168.1.88', os: 'macOS 14', browser: 'Safari 17', success: 1 },
  { username: 'unknown', loginTime: '2026-04-05 22:01:00', ip: '198.51.100.2', os: 'Linux', browser: 'curl', success: 0, failReason: '账号不存在' },
  { username: 'admin', loginTime: '2026-04-06 09:10:00', ip: '10.0.0.12', os: 'Windows 11', browser: 'Chrome 131', success: 1 },
  { username: 'wangwu', loginTime: '2026-04-05 14:30:00', ip: '192.168.2.3', os: 'Android 14', browser: 'Chrome Mobile', success: 1 },
  { username: 'admin', loginTime: '2026-04-04 07:00:00', ip: '10.0.0.12', os: 'Windows 11', browser: 'Chrome 131', success: 1 },
];

export const IMG_HALL = '/prototype/assets/pano-museum-indoor-hall.png';
export const IMG_COFFIN = '/prototype/assets/pano-museum-indoor-coffin.png';
export const MODEL_URL = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
