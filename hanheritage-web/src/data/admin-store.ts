export interface Dept {
  id: string
  name: string
  parentId: string | null
  sort: number
}

export interface Role {
  id: string
  name: string
  parentId: string | null
  sort: number
  code: string
  remark: string
  dataScope: string
  permissionIds: string[]
}

export interface Post {
  id: string
  name: string
  parentId: string | null
  sort: number
  remark: string
  permissionIds: string[]
}

export interface User {
  id: string
  username?: string
  realName: string
  name?: string
  phone: string
  email?: string
  deptId: string
  deptName?: string
  dept?: { id: string; name: string }
  roleIds: string[]
  roleNames?: string
  roles?: { id: string; name: string }[]
  postIds: string[]
  postNames?: string
  status: string
  createdAt?: string
  account?: string
}

export interface OperationLog {
  id: string
  at: number
  userDisplay: string
  module: string
  action: string
  detail: string
  ip: string
}

export interface LoginLog {
  id: string
  at: number
  account: string
  ip: string
  os: string
  browser: string
  result: string
  message: string
}

export interface OnlineUser {
  id: string
  name: string
  dept: string
  loginAt: number
  ip: string
  client: string
}

export interface NoticeScope {
  type: string
  ids: string[]
}

export interface Notice {
  id: string
  title: string
  content: string
  contentHtml: string
  status: string
  scope: NoticeScope
  publishedAt: number | null
  updatedAt: number
}

export interface Profile {
  account: string
  displayName: string
  phone: string
  email: string
  dept: string
  roles: string
  createdAt: string
}

export interface MenuItem {
  id: string
  name: string
  icon: string
  sort: number
  perms: string
  component: string
  status: string
  createTime: string
  linkId: string | null
  children: MenuItem[]
}

export interface PermissionMenu {
  id: string
  label: string
}

function dayMs(y: number, m: number, d: number, hh = 0, mm = 0): number {
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime()
}

export const permissionMenus: PermissionMenu[] = [
  { id: 'm1', label: '系统管理（用户/角色/部门/岗位）' },
  { id: 'm2', label: '崖墓与墓口台账' },
  { id: 'm3', label: '石棺与文物资源' },
  { id: 'm4', label: '多媒体与全景' },
  { id: 'm5', label: '日志与审计（只读）' },
]

export const depts: Dept[] = [
  { id: 'd1', name: '合江崖墓数字化项目组', parentId: null, sort: 1 },
  { id: 'd2', name: '博物馆', parentId: 'd1', sort: 1 },
  { id: 'd3', name: '信息中心', parentId: 'd2', sort: 1 },
  { id: 'd4', name: '展教部', parentId: 'd2', sort: 2 },
]

export const roles: Role[] = [
  { id: 'r1', name: '系统管理员', parentId: null, sort: 1, code: 'SYS_ADMIN', remark: '全部功能', dataScope: 'all', permissionIds: ['m1', 'm2', 'm3', 'm4', 'm5'] },
  { id: 'r2', name: '业务管理员', parentId: 'r1', sort: 1, code: 'BIZ_ADMIN', remark: '业务与资源', dataScope: 'dept', permissionIds: ['m2', 'm3', 'm4'] },
  { id: 'r3', name: '内容编辑', parentId: 'r2', sort: 1, code: 'EDITOR', remark: '内容维护', dataScope: 'dept', permissionIds: ['m3', 'm4'] },
  { id: 'r4', name: '访客角色', parentId: null, sort: 2, code: 'GUEST', remark: '只读浏览', dataScope: 'all', permissionIds: ['m5'] },
]

export const posts: Post[] = [
  { id: 'p1', name: '馆长', parentId: null, sort: 1, remark: '全面负责', permissionIds: ['m1', 'm2', 'm3', 'm4', 'm5'] },
  { id: 'p2', name: '副馆长', parentId: 'p1', sort: 1, remark: '协管业务', permissionIds: ['m2', 'm3', 'm4'] },
  { id: 'p3', name: '展教专员', parentId: 'p2', sort: 2, remark: '展陈与讲解', permissionIds: ['m3', 'm5'] },
]

export const users: User[] = [
  { id: 'u1', realName: '系统管理员', phone: '13800000001', deptId: 'd3', roleIds: ['r1'], postIds: ['p1'], status: 'enabled' },
  { id: 'u2', realName: '张三', phone: '13800000002', deptId: 'd4', roleIds: ['r3'], postIds: ['p3'], status: 'enabled' },
  { id: 'u3', realName: '李四', phone: '13800000003', deptId: 'd2', roleIds: ['r2', 'r4'], postIds: ['p2'], status: 'disabled' },
]

export const operationLogs: OperationLog[] = [
  { id: 'op1', at: dayMs(2026, 4, 7, 9, 5), userDisplay: '系统管理员', module: '崖墓管理', action: '编辑', detail: '更新「大耳朵崖墓群」台账', ip: '10.0.0.12' },
  { id: 'op2', at: dayMs(2026, 4, 7, 9, 18), userDisplay: '张三', module: '石棺管理', action: '上传', detail: '模型文件 coffin_m2.glb', ip: '10.0.0.15' },
  { id: 'op3', at: dayMs(2026, 4, 7, 9, 42), userDisplay: '系统管理员', module: '用户管理', action: '新增', detail: '新增用户：王五', ip: '10.0.0.12' },
  { id: 'op4', at: dayMs(2026, 4, 7, 10, 1), userDisplay: '李四', module: '资源管理', action: '删除', detail: '删除文件夹「临时扫描」', ip: '192.168.1.88' },
  { id: 'op5', at: dayMs(2026, 4, 6, 16, 30), userDisplay: '系统管理员', module: '角色管理', action: '编辑', detail: '调整角色「内容编辑」权限', ip: '10.0.0.12' },
  { id: 'op6', at: dayMs(2026, 4, 6, 14, 20), userDisplay: '张三', module: '崖墓管理', action: '查看', detail: '打开全景配置', ip: '10.0.0.15' },
  { id: 'op7', at: dayMs(2026, 4, 5, 11, 0), userDisplay: '王五', module: '通知公告', action: '发布', detail: '发布「清明开放公告」', ip: '192.168.2.3' },
  { id: 'op8', at: dayMs(2026, 4, 4, 9, 0), userDisplay: '系统管理员', module: '部门管理', action: '新增', detail: '新增部门「文保中心」', ip: '10.0.0.12' },
  { id: 'op9', at: dayMs(2026, 4, 3, 17, 45), userDisplay: '访客账号', module: '石棺管理', action: '导出', detail: '导出资源清单 CSV', ip: '203.0.113.9' },
  { id: 'op10', at: dayMs(2026, 4, 2, 8, 55), userDisplay: '系统管理员', module: '菜单管理', action: '编辑', detail: '调整侧栏菜单排序', ip: '10.0.0.12' },
]

export const loginLogs: LoginLog[] = [
  { id: 'lg1', at: dayMs(2026, 4, 7, 8, 58), account: '系统管理员', ip: '10.0.0.12', os: 'Windows', browser: 'Chrome', result: '成功', message: '登录成功' },
  { id: 'lg2', at: dayMs(2026, 4, 7, 9, 2), account: '张三', ip: '10.0.0.15', os: 'Windows', browser: 'Edge', result: '成功', message: '登录成功' },
  { id: 'lg3', at: dayMs(2026, 4, 7, 8, 50), account: 'guest', ip: '192.168.1.20', os: 'Windows', browser: 'Chrome', result: '失败', message: '密码错误' },
  { id: 'lg4', at: dayMs(2026, 4, 6, 18, 0), account: '李四', ip: '192.168.1.88', os: 'macOS', browser: 'Safari', result: '成功', message: '登录成功' },
  { id: 'lg5', at: dayMs(2026, 4, 6, 9, 10), account: '系统管理员', ip: '10.0.0.12', os: 'Windows', browser: 'Chrome', result: '成功', message: '登录成功' },
  { id: 'lg6', at: dayMs(2026, 4, 5, 22, 1), account: 'unknown', ip: '198.51.100.2', os: 'Linux', browser: 'Firefox', result: '失败', message: '账号不存在' },
  { id: 'lg7', at: dayMs(2026, 4, 5, 14, 30), account: '王五', ip: '192.168.2.3', os: 'Android', browser: 'Chrome', result: '成功', message: '登录成功' },
  { id: 'lg8', at: dayMs(2026, 4, 4, 7, 0), account: '系统管理员', ip: '10.0.0.12', os: 'Windows', browser: 'Chrome', result: '成功', message: '登录成功' },
]

export const onlineUsers: OnlineUser[] = [
  { id: 'on1', name: '系统管理员', dept: '信息中心', loginAt: dayMs(2026, 4, 7, 8, 58), ip: '10.0.0.12', client: 'Chrome 131 / Windows' },
  { id: 'on2', name: '张三', dept: '展教部', loginAt: dayMs(2026, 4, 7, 9, 2), ip: '10.0.0.15', client: 'Edge 130 / Windows' },
  { id: 'on3', name: '李四', dept: '博物馆', loginAt: dayMs(2026, 4, 6, 18, 0), ip: '192.168.1.88', client: 'Safari / macOS' },
  { id: 'on4', name: '王五', dept: '文保中心', loginAt: dayMs(2026, 4, 5, 14, 30), ip: '192.168.2.3', client: 'Chrome / Android' },
]

export const defaultNotices: Notice[] = [
  {
    id: 'n1',
    title: '系统维护通知',
    content: '计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。',
    contentHtml: '<p>计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。</p>',
    status: 'published',
    scope: { type: 'all', ids: [] },
    publishedAt: new Date(2026, 5, 22, 0, 0).getTime(),
    updatedAt: new Date(2026, 5, 20, 10, 0).getTime(),
  },
  {
    id: 'n2',
    title: '内部培训（草稿）',
    content: '新员工平台使用培训，时间待定。',
    contentHtml: '<p>新员工平台使用培训，时间待定。</p>',
    status: 'draft',
    scope: { type: 'all', ids: [] },
    publishedAt: null,
    updatedAt: new Date(2026, 3, 1, 10, 0).getTime(),
  },
]

export const defaultProfile: Profile = {
  account: 'admin',
  displayName: '管理员',
  phone: '13800000000',
  email: '',
  dept: '信息中心',
  roles: '系统管理员',
  createdAt: '2026-01-15 10:00',
}

export const defaultMenuTree: MenuItem[] = [
  {
    id: 'mg-workbench', name: '工作台', icon: 'guide', sort: 0, perms: '', component: '', status: 'normal', createTime: '2026-01-08 08:30:15', linkId: null,
    children: [
      { id: 'mn-dashboard', name: '首页概览', icon: 'dashboard', sort: 0, perms: 'dashboard:list', component: 'dashboard/index', status: 'normal', createTime: '2026-01-08 08:31:02', linkId: 'dashboard', children: [] },
    ],
  },
  {
    id: 'mg-biz', name: '业务数据', icon: 'cascader', sort: 1, perms: '', component: '', status: 'normal', createTime: '2026-01-08 09:00:00', linkId: null,
    children: [
      { id: 'mn-cliff', name: '崖墓管理', icon: 'tree', sort: 0, perms: 'cliff:list', component: 'cliff/index', status: 'normal', createTime: '2026-01-08 09:05:11', linkId: 'cliff', children: [] },
      { id: 'mn-coffin', name: '石棺管理', icon: 'component', sort: 1, perms: 'coffin:list', component: 'coffin/index', status: 'normal', createTime: '2026-01-08 09:05:22', linkId: 'coffin', children: [] },
      { id: 'mn-museum', name: '博物馆全景管理', icon: 'camera', sort: 2, perms: 'panorama:list', component: 'museum/index', status: 'normal', createTime: '2026-01-08 09:06:00', linkId: 'museum-pano', children: [] },
      { id: 'mn-resource', name: '资源管理', icon: 'documentation', sort: 3, perms: 'resource:list', component: 'resource/index', status: 'normal', createTime: '2026-01-08 09:06:18', linkId: 'resource', children: [] },
    ],
  },
  {
    id: 'mg-org', name: '组织与权限', icon: 'peoples', sort: 2, perms: '', component: '', status: 'normal', createTime: '2026-01-08 10:00:00', linkId: null,
    children: [
      { id: 'mn-user', name: '用户管理', icon: 'user', sort: 0, perms: 'system:user:list', component: 'system/user/index', status: 'normal', createTime: '2026-01-08 10:01:00', linkId: 'user', children: [] },
      { id: 'mn-role', name: '角色管理', icon: 'lock', sort: 1, perms: 'system:role:list', component: 'system/role/index', status: 'normal', createTime: '2026-01-08 10:01:10', linkId: 'role', children: [] },
      { id: 'mn-dept', name: '部门管理', icon: 'tree-table', sort: 2, perms: 'system:dept:list', component: 'system/dept/index', status: 'normal', createTime: '2026-01-08 10:01:20', linkId: 'dept', children: [] },
      { id: 'mn-post', name: '岗位管理', icon: 'postcard', sort: 3, perms: 'system:post:list', component: 'system/post/index', status: 'normal', createTime: '2026-01-08 10:01:30', linkId: 'post', children: [] },
    ],
  },
  {
    id: 'mg-log', name: '日志与在线', icon: 'log', sort: 3, perms: '', component: '', status: 'normal', createTime: '2026-01-08 11:00:00', linkId: null,
    children: [
      { id: 'mn-logop', name: '操作日志', icon: 'form', sort: 0, perms: 'monitor:operlog:list', component: 'monitor/operlog/index', status: 'normal', createTime: '2026-01-08 11:01:00', linkId: 'log-op', children: [] },
      { id: 'mn-login', name: '登录日志', icon: 'logininfor', sort: 1, perms: 'monitor:logininfor:list', component: 'monitor/logininfor/index', status: 'normal', createTime: '2026-01-08 11:01:10', linkId: 'log-in', children: [] },
      { id: 'mn-online', name: '在线用户', icon: 'online', sort: 2, perms: 'monitor:online:list', component: 'monitor/online/index', status: 'normal', createTime: '2026-01-08 11:01:20', linkId: 'online', children: [] },
    ],
  },
  {
    id: 'mg-ops', name: '运维监控', icon: 'server', sort: 4, perms: '', component: '', status: 'normal', createTime: '2026-01-08 12:00:00', linkId: null,
    children: [
      { id: 'mn-monjvm', name: '服务监控', icon: 'monitor', sort: 0, perms: 'monitor:server:list', component: 'monitor/server/index', status: 'normal', createTime: '2026-01-08 12:01:00', linkId: 'mon-jvm', children: [] },
      { id: 'mn-monredis', name: '缓存监控', icon: 'redis', sort: 1, perms: 'monitor:cache:list', component: 'monitor/cache/index', status: 'normal', createTime: '2026-01-08 12:01:10', linkId: 'mon-redis', children: [] },
    ],
  },
  {
    id: 'mg-sys', name: '系统配置', icon: 'system', sort: 5, perms: '', component: '', status: 'normal', createTime: '2026-01-08 13:00:00', linkId: null,
    children: [
      { id: 'mn-menu', name: '菜单管理', icon: 'tree-table', sort: 0, perms: 'system:menu:list', component: 'system/menu/index', status: 'normal', createTime: '2026-01-08 13:01:10', linkId: 'menu', children: [] },
      { id: 'mn-notice', name: '通知公告', icon: 'message', sort: 1, perms: 'system:notice:list', component: 'system/notice/index', status: 'normal', createTime: '2026-01-08 13:01:20', linkId: 'notice', children: [] },
    ],
  },
  {
    id: 'mg-account', name: '账户', icon: 'user', sort: 6, perms: '', component: '', status: 'normal', createTime: '2026-01-08 14:00:00', linkId: null,
    children: [
      { id: 'mn-profile', name: '个人信息', icon: 'people', sort: 0, perms: 'system:profile:view', component: 'system/profile/index', status: 'normal', createTime: '2026-01-08 14:01:00', linkId: 'profile', children: [] },
    ],
  },
]

export const LEVEL_OPTIONS = [
  '全国重点文物保护单位',
  '省级文物保护单位',
  '市级和县级文物保护单位',
  '尚未核定公布为文物保护单位的不可移动文物',
  '未认定',
]

export const CATEGORY_OPTIONS = ['帝王陵寝', '名人或贵族墓', '普通墓葬', '其他古墓葬']

export const TOWN_OPTIONS = [
  '白沙镇', '望龙镇', '白米镇', '临港街道', '符阳街道', '荔江镇',
  '神臂城镇', '大桥镇', '真龙镇', '先市镇', '法王寺镇', '尧坝镇', '九支镇',
  '车辋镇', '凤鸣镇', '甘雨镇', '榕山镇', '白鹿镇', '石龙镇', '先锋镇',
  '福宝镇', '先滩镇',
]

export const COFFIN_REGISTRY_FIELDS = [
  { key: 'originalName', label: '原名' },
  { key: 'registryType', label: '藏品总登记号（栏目标识）' },
  { key: 'collectionId', label: '藏品编号' },
  { key: 'code', label: '台账序号' },
  { key: 'title', label: '名称' },
  { key: 'tombGroup', label: '所属崖墓群' },
  { key: 'eraCategory', label: '年代类型' },
  { key: 'dynasty', label: '朝代' },
  { key: 'eraSpecific', label: '具体年代' },
  { key: 'artifactCategory', label: '文物类别' },
  { key: 'textureType', label: '质地类型' },
  { key: 'materialCategory', label: '质地属性' },
  { key: 'materialSpecific', label: '具体质地' },
  { key: 'quantity', label: '实际数量' },
  { key: 'dimLength', label: '外形尺寸·长（cm）' },
  { key: 'dimWidth', label: '外形尺寸·宽（cm）' },
  { key: 'dimHeight', label: '外形尺寸·高（cm）' },
  { key: 'dimText', label: '具体尺寸（文字）' },
  { key: 'weightRange', label: '重量范围' },
  { key: 'weightValue', label: '重量' },
  { key: 'weightUnit', label: '重量单位' },
  { key: 'relicGrade', label: '文物级别' },
  { key: 'sourceType', label: '文物来源' },
  { key: 'sourceDetail', label: '来源具体信息' },
  { key: 'completeness', label: '完残程度' },
  { key: 'completenessDetail', label: '完残状况' },
  { key: 'preservationStatus', label: '保存状态' },
  { key: 'accessionRange', label: '入藏时间范围' },
  { key: 'accessionYear', label: '入藏年度' },
  { key: 'mapLeft', label: '地图点位 X（%）' },
  { key: 'mapTop', label: '地图点位 Y（%）' },
]

export const EDIT_SECTIONS = [
  { title: '登记与编号', keys: ['originalName', 'registryType', 'collectionId', 'code', 'title', 'tombGroup'] },
  { title: '年代与类别', keys: ['eraCategory', 'dynasty', 'eraSpecific', 'artifactCategory'] },
  { title: '质地与数量', keys: ['textureType', 'materialCategory', 'materialSpecific', 'quantity'] },
  { title: '外形尺寸', keys: ['dimLength', 'dimWidth', 'dimHeight', 'dimText'] },
  { title: '质量', keys: ['weightRange', 'weightValue', 'weightUnit'] },
  { title: '级别与来源', keys: ['relicGrade', 'sourceType', 'sourceDetail'] },
  { title: '完残与保存', keys: ['completeness', 'completenessDetail', 'preservationStatus'] },
  { title: '入藏信息', keys: ['accessionRange', 'accessionYear'] },
  { title: '地图点位', keys: ['mapLeft', 'mapTop'] },
]

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
]

export const CLIFF_BASE = [
  { name: '洞溪崖墓群', town: '神臂城镇' },
  { name: '黄溪侯五墙崖墓群', town: '神臂城镇' },
  { name: '芭蕉湾崖墓群', town: '大桥镇' },
  { name: '蒋湾和幸福崖墓群', town: '真龙镇、先市镇毗邻' },
  { name: '大耳朵崖墓群', town: '临港街道', address: '四川省泸州市合江县临港街道梨子湾社区一带，地处笔架山公园附近（迁建范围以实测为准）', lng: '105.83458', lat: '28.82576', area: '296 平方米', level: '全国重点文物保护单位', era: '东汉', category: '普通墓葬', protectionUnitName: '大耳朵崖墓群', composition: '崖墓群含 M1—M6 等墓口；葬具见画像石棺、石筑墓室及建筑构件等，各墓口形制、尺寸有异（摘录登记表）', intro: '<p>大耳朵崖墓群分布于红砂岩崖壁，为东汉时期崖洞式墓葬。2013 年公布为全国重点文物保护单位。</p>' },
  { name: '魏家祠崖墓群', town: '符阳街道' },
  { name: '观音岩崖墓群', town: '荔江镇' },
  { name: '渔链子崖墓群', town: '荔江镇' },
  { name: '大路边崖墓群', town: '车辋镇' },
  { name: '佛子岩崖墓群', town: '榕山镇' },
  { name: '鱼天堂崖墓群', town: '福宝镇' },
  { name: '高村崖墓群', town: '石龙镇' },
  { name: '梭滩石崖墓群', town: '先滩镇' },
]

export const MAP_MARKERS_13 = [
  { id: 1, left: 13, top: 21 },
  { id: 2, left: 17, top: 28 },
  { id: 3, left: 31, top: 41 },
  { id: 4, left: 35, top: 50 },
  { id: 5, left: 46, top: 33, featured: true },
  { id: 6, left: 51, top: 43 },
  { id: 7, left: 39, top: 47 },
  { id: 8, left: 41, top: 55 },
  { id: 9, left: 56, top: 51 },
  { id: 10, left: 61, top: 45 },
  { id: 11, left: 68, top: 39 },
  { id: 12, left: 75, top: 46 },
  { id: 13, left: 83, top: 57 },
]

export const RESOURCE_TYPES = [
  { value: '', label: '全部类型' },
  { value: 'doc', label: '数字文档' },
  { value: 'image', label: '平面影像' },
  { value: 'model', label: '三维模型' },
  { value: 'scan', label: '扫描数据' },
  { value: 'pointcloud', label: '点云数据' },
  { value: 'deliverable', label: '成果数据' },
  { value: 'video', label: '视频' },
]

export const PANO_CATEGORIES = [
  { key: 'air', label: '空中' },
  { key: 'ground', label: '地面' },
  { key: 'inner', label: '内部' },
  { key: 'outdoor', label: '室外' },
]

export function getDeptName(id: string): string {
  return depts.find(d => d.id === id)?.name ?? '—'
}

export function getRoleNames(ids: string[]): string {
  return ids.map(id => roles.find(r => r.id === id)?.name ?? '—').join('、')
}

export function getPostNames(ids: string[]): string {
  return ids.map(id => posts.find(p => p.id === id)?.name ?? '—').join('、')
}

export function fmtDate(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => n < 10 ? '0' + n : String(n)
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

export function fmtShortDate(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => n < 10 ? '0' + n : String(n)
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

export function scopeText(scope: NoticeScope): string {
  if (scope.type === 'dept') return '部门可见'
  if (scope.type === 'role') return '角色可见'
  return '全体可见'
}
