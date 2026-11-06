import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import {
  users as mockUsers,
  roles as mockRoles,
  depts as mockDepts,
  posts as mockPosts,
  loginLogs as mockLoginLogs,
  onlineUsers as mockOnlineUsers,
  defaultMenuTree,
  getDeptName,
  getRoleNames,
  getPostNames,
  fmtDate,
} from '@/data/admin-store'
import type { User, Role, Dept, Post, LoginLog, OnlineUser, MenuItem } from '@/data/admin-store'

export type { LoginLog, OnlineUser }

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface UserQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}

let localUserStore = [...mockUsers]

function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

function transformUserFromApi(u: any): User {
  return {
    id: u.id,
    realName: u.name,
    phone: maskPhone(u.phone || ''),
    deptId: u.deptId || '',
    deptName: u.dept?.name || '',
    roleIds: u.roles ? u.roles.map((r: any) => r.id) : [],
    roleNames: u.roles ? u.roles.map((r: any) => r.name).join('、') : '',
    postIds: u.posts ? u.posts.map((p: any) => p.id) : [],
    postNames: u.posts ? u.posts.map((p: any) => p.name).join('、') : '',
    status: u.status === 1 ? 'enabled' : 'disabled',
  }
}

function transformUserToApi(data: Partial<User>): any {
  const payload: any = {}
  if (data.realName !== undefined) payload.name = data.realName
  if (data.phone !== undefined) payload.phone = data.phone
  if (data.email !== undefined) payload.email = data.email
  if (data.deptId !== undefined) payload.deptId = data.deptId
  if (data.roleIds !== undefined) payload.roleIds = data.roleIds
  if (data.postIds !== undefined) payload.postIds = data.postIds
  if (data.status !== undefined) payload.status = data.status === 'enabled' ? 1 : 0
  return payload
}

export async function getUserList(query: UserQuery = {}): Promise<PageResult<User>> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localUserStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(u => u.realName.toLowerCase().includes(kw) || u.phone.includes(kw))
    }
    if (query.status) {
      filtered = filtered.filter(u => u.status === query.status)
    }
    const maskedItems = paginate(filtered, page, pageSize).map(u => ({ ...u, phone: maskPhone(u.phone) }))
    return mockRequest({ items: maskedItems, total: filtered.length, page, pageSize })
  }
  const res = await request.get('/users', { params: query }) as any
  if (Array.isArray(res)) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const total = res.length
    const start = (page - 1) * pageSize
    const items = res.slice(start, start + pageSize).map(transformUserFromApi)
    return { items, total, page, pageSize }
  }
  const items = (res.items || []).map(transformUserFromApi)
  return { ...res, items }
}

export async function createUser(data: Partial<User>): Promise<User> {
  if (isLocalMode) {
    const item: User = { id: 'u' + Date.now(), realName: data.realName || '', phone: data.phone || '', deptId: data.deptId || '', roleIds: data.roleIds || [], postIds: data.postIds || [], status: data.status || 'enabled' }
    localUserStore.push(item)
    return mockRequest(item)
  }
  const payload = transformUserToApi(data)
  const res = await request.post('/users', payload)
  return transformUserFromApi(res)
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  if (isLocalMode) {
    const idx = localUserStore.findIndex(u => u.id === id)
    if (idx >= 0) {
      localUserStore[idx] = { ...localUserStore[idx], ...data }
      return mockRequest(localUserStore[idx])
    }
    return mockRequest({} as User)
  }
  const payload = transformUserToApi(data)
  const res = await request.put(`/users/${id}`, payload)
  return transformUserFromApi(res)
}

export async function toggleUserStatus(id: string): Promise<any> {
  return request.put('/users/' + id + '/status')
}

export async function deleteUser(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localUserStore = localUserStore.filter(u => u.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/users/${id}`) as Promise<{ deleted: number }>
}

export async function getUserPhone(id: string): Promise<{ phone: string }> {
  if (isLocalMode) {
    const user = localUserStore.find(u => u.id === id)
    return mockRequest({ phone: user?.phone || '' })
  }
  return request.get(`/users/${id}/phone`) as Promise<{ phone: string }>
}

export interface RoleQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

let localRoleStore = [...mockRoles]

function transformRoleFromApi(r: any): Role {
  return {
    id: r.id,
    name: r.name,
    parentId: r.parentId || null,
    sort: r.sort ?? 1,
    code: r.code || '',
    remark: r.remark || '',
    dataScope: r.dataScope || 'dept',
    permissionIds: r.permissionIds ? r.permissionIds.map((p: any) => String(p)) : [],
  }
}

export async function getRoleList(query: RoleQuery = {}): Promise<PageResult<Role>> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localRoleStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw))
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/roles', { params: query }) as any
  if (Array.isArray(res)) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const total = res.length
    const start = (page - 1) * pageSize
    const items = res.slice(start, start + pageSize).map(transformRoleFromApi)
    return { items, total, page, pageSize }
  }
  const items = (res.items || []).map(transformRoleFromApi)
  return { ...res, items }
}

export async function createRole(data: Partial<Role>): Promise<Role> {
  if (isLocalMode) {
    const item: Role = { id: 'r' + Date.now(), name: data.name || '', parentId: data.parentId || null, sort: data.sort ?? 1, code: data.code || '', remark: data.remark || '', dataScope: data.dataScope || 'dept', permissionIds: data.permissionIds || [] }
    localRoleStore.push(item)
    return mockRequest(item)
  }
  return request.post('/roles', data)
}

export async function updateRole(id: string, data: Partial<Role>): Promise<Role> {
  if (isLocalMode) {
    const idx = localRoleStore.findIndex(r => r.id === id)
    if (idx >= 0) {
      localRoleStore[idx] = { ...localRoleStore[idx], ...data }
      return mockRequest(localRoleStore[idx])
    }
    return mockRequest({} as Role)
  }
  return request.put(`/roles/${id}`, data)
}

export async function deleteRole(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localRoleStore = localRoleStore.filter(r => r.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/roles/${id}`) as Promise<{ deleted: number }>
}

export async function getDeptTree(): Promise<Dept[]> {
  if (isLocalMode) {
    return mockRequest([...mockDepts])
  }
  return request.get('/depts/tree')
}

export async function createDept(data: Partial<Dept>): Promise<Dept> {
  if (isLocalMode) {
    const item: Dept = { id: 'd' + Date.now(), name: data.name || '', parentId: data.parentId || null, sort: data.sort ?? 1 }
    return mockRequest(item)
  }
  return request.post('/depts', data)
}

export async function updateDept(id: string, data: Partial<Dept>): Promise<Dept> {
  if (isLocalMode) {
    return mockRequest({ ...data, id } as Dept)
  }
  return request.put(`/depts/${id}`, data)
}

export async function deleteDept(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/depts/${id}`) as Promise<{ deleted: number }>
}

export interface PostQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

let localPostStore = [...mockPosts]

function transformPostFromApi(p: any): Post {
  return {
    id: p.id,
    name: p.name,
    parentId: p.parentId || null,
    sort: p.sort ?? 1,
    remark: p.remark || '',
    permissionIds: p.permissionIds ? p.permissionIds.map((pm: any) => String(pm)) : [],
  }
}

export async function getPostList(query: PostQuery = {}): Promise<PageResult<Post>> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localPostStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(kw))
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/posts', { params: query }) as any
  if (Array.isArray(res)) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const total = res.length
    const start = (page - 1) * pageSize
    const items = res.slice(start, start + pageSize).map(transformPostFromApi)
    return { items, total, page, pageSize }
  }
  const items = (res.items || []).map(transformPostFromApi)
  return { ...res, items }
}

export async function getAllPosts(): Promise<Post[]> {
  if (isLocalMode) {
    return mockRequest([...localPostStore])
  }
  const res = await request.get('/posts') as any
  if (Array.isArray(res)) {
    return res.map(transformPostFromApi)
  }
  return (res.items || []).map(transformPostFromApi)
}

export async function createPost(data: Partial<Post>): Promise<Post> {
  if (isLocalMode) {
    const item: Post = { id: 'p' + Date.now(), name: data.name || '', parentId: data.parentId || null, sort: data.sort ?? 1, remark: data.remark || '', permissionIds: data.permissionIds || [] }
    localPostStore.push(item)
    return mockRequest(item)
  }
  return request.post('/posts', data)
}

export async function updatePost(id: string, data: Partial<Post>): Promise<Post> {
  if (isLocalMode) {
    const idx = localPostStore.findIndex(p => p.id === id)
    if (idx >= 0) {
      localPostStore[idx] = { ...localPostStore[idx], ...data }
      return mockRequest(localPostStore[idx])
    }
    return mockRequest({} as Post)
  }
  return request.put(`/posts/${id}`, data)
}

export async function deletePost(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localPostStore = localPostStore.filter(p => p.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/posts/${id}`) as Promise<{ deleted: number }>
}

let localMenuStore: MenuItem[] = []

function initLocalMenuStore() {
  if (localMenuStore.length === 0) {
    localMenuStore = JSON.parse(JSON.stringify(defaultMenuTree))
  }
}

function findMenuItem(tree: MenuItem[], id: string): MenuItem | null {
  for (const item of tree) {
    if (item.id === id) return item
    if (item.children && item.children.length > 0) {
      const found = findMenuItem(item.children, id)
      if (found) return found
    }
  }
  return null
}

function updateMenuItem(tree: MenuItem[], id: string, data: Partial<MenuItem>): boolean {
  for (const item of tree) {
    if (item.id === id) {
      Object.assign(item, data)
      return true
    }
    if (item.children && item.children.length > 0) {
      if (updateMenuItem(item.children, id, data)) return true
    }
  }
  return false
}

function deleteMenuItem(tree: MenuItem[], id: string): boolean {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      tree.splice(i, 1)
      return true
    }
    if (tree[i].children && tree[i].children.length > 0) {
      if (deleteMenuItem(tree[i].children, id)) return true
    }
  }
  return false
}

function transformMenuFromApi(m: any): MenuItem {
  const raw = m.linkId || m.path || null
  const linkId = raw ? raw.replace(/^\/admin\//, '') : null
  return {
    id: m.id,
    name: m.name,
    icon: m.icon || '',
    sort: m.sort ?? 0,
    perms: m.perms || '',
    component: m.component || '',
    status: m.status === 1 ? 'normal' : 'disabled',
    createTime: m.createTime || '',
    linkId,
    children: (m.children || []).map((c: any) => transformMenuFromApi(c)),
  }
}

export async function getMenuTree(): Promise<MenuItem[]> {
  if (isLocalMode) {
    initLocalMenuStore()
    return mockRequest(JSON.parse(JSON.stringify(localMenuStore)))
  }
  const res = await request.get('/menus/tree')
  return ((res as unknown) as any[]).map(transformMenuFromApi)
}

function transformMenuToApi(data: Partial<MenuItem>): any {
  const payload: any = { ...data }
  if (data.status !== undefined) {
    payload.status = data.status === 'normal' ? 1 : 0
  }
  if (data.linkId !== undefined && !payload.path) {
    payload.path = data.linkId
  }
  return payload
}

export async function createMenu(data: Partial<MenuItem>): Promise<MenuItem> {
  if (isLocalMode) {
    initLocalMenuStore()
    const newItem: MenuItem = {
      ...data,
      id: 'mn_' + Date.now(),
      children: [],
    } as MenuItem
    localMenuStore.push(newItem)
    return mockRequest(newItem)
  }
  const payload = transformMenuToApi(data)
  const res = await request.post('/menus', payload)
  return transformMenuFromApi(res)
}

export async function updateMenu(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
  if (isLocalMode) {
    initLocalMenuStore()
    const item = findMenuItem(localMenuStore, id)
    if (item) {
      Object.assign(item, data)
    }
    return mockRequest({ ...item, ...data, id } as MenuItem)
  }
  const payload = transformMenuToApi(data)
  const res = await request.put(`/menus/${id}`, payload)
  return transformMenuFromApi(res)
}

export async function deleteMenu(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    initLocalMenuStore()
    const deleted = deleteMenuItem(localMenuStore, id)
    return mockRequest({ deleted: deleted ? 1 : 0 })
  }
  return request.delete(`/menus/${id}`) as Promise<{ deleted: number }>
}

export interface LoginLogQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

let localLoginLogStore = [...mockLoginLogs]

function transformLoginLogFromApi(l: any): LoginLog {
  return {
    id: l.id,
    account: l.username,
    at: new Date(l.loginTime).getTime(),
    ip: l.ip || '',
    os: l.os || '',
    browser: l.browser || '',
    result: l.success === 1 ? '成功' : '失败',
    message: l.failReason || '',
  }
}

export async function getLoginLogs(query: LoginLogQuery = {}): Promise<PageResult<LoginLog>> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localLoginLogStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(l => l.account.toLowerCase().includes(kw) || l.ip.includes(kw) || l.message.toLowerCase().includes(kw))
    }
    filtered = filtered.sort((a, b) => b.at - a.at)
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/logs/login', { params: query }) as any
  if (Array.isArray(res)) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const total = res.length
    const start = (page - 1) * pageSize
    const items = res.slice(start, start + pageSize).map(transformLoginLogFromApi)
    return { items, total, page, pageSize }
  }
  const items = (res.items || []).map(transformLoginLogFromApi)
  return { ...res, items }
}

export async function deleteLoginLog(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localLoginLogStore = localLoginLogStore.filter(l => l.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/logs/login/${id}`) as Promise<{ deleted: number }>
}

export async function exportLoginLogs(): Promise<{ items: LoginLog[] }> {
  if (isLocalMode) {
    return mockRequest({ items: localLoginLogStore })
  }
  const res = await request.get('/logs/login/export') as { items: any[] }
  return { items: (res.items || []).map(transformLoginLogFromApi) }
}

export async function deleteLoginLogs(ids: string[]): Promise<{ deleted: number }> {
  if (isLocalMode) {
    const set = new Set(ids)
    const before = localLoginLogStore.length
    localLoginLogStore = localLoginLogStore.filter(l => !set.has(l.id))
    return mockRequest({ deleted: before - localLoginLogStore.length })
  }
  return request.delete('/logs/login/batch', { data: { ids } }) as Promise<{ deleted: number }>
}

export async function clearLoginLogs(): Promise<{ deleted: number }> {
  if (isLocalMode) {
    const deleted = localLoginLogStore.length
    localLoginLogStore = []
    return mockRequest({ deleted })
  }
  return request.delete('/logs/login/clear') as Promise<{ deleted: number }>
}

export interface OnlineUserQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

let localOnlineStore = [...mockOnlineUsers]

export async function getOnlineUsers(query: OnlineUserQuery = {}): Promise<PageResult<OnlineUser>> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localOnlineStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(o => o.name.toLowerCase().includes(kw) || o.dept.toLowerCase().includes(kw))
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/monitor/online-users', { params: query }) as any
  const users = res.users || []
  return {
    items: users,
    total: res.count ?? users.length,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
  }
}

export async function forceLogout(id: string): Promise<{ success: boolean }> {
  if (isLocalMode) {
    localOnlineStore = localOnlineStore.filter(o => o.id !== id)
    return mockRequest({ success: true })
  }
  return request.delete(`/monitor/online/${id}`) as Promise<{ success: boolean }>
}

export interface DashboardSummary {
  counts: {
    cliffs: number
    coffins: number
    panoramas: number
    publishedNotices: number
    users: number
    onlineUsers: number
    operationLogs: number
    loginLogs: number
    resources: number
  }
  notices: Array<{
    id: string
    title: string
    content: string
    contentHtml: string
    scope: string
    publishedAt: string
  }>
  resourceStats: Array<{ type: string; count: number }>
  loginTrend: Array<{ date: string; count: number }>
  recentOperations: Array<{
    id: string
    at: number
    userDisplay: string
    module: string
    action: string
    detail: string
    ip: string
  }>
  onlineUserList: Array<{
    id: string
    name: string
    dept: string
    loginAt: number
    ip: string
  }>
  collectedAt: string
}

export interface DiskInfo {
  filesystem: string
  mount: string
  total: number
  used: number
  free: number
  usagePct: number
}

export interface ServerInfo {
  hostname: string
  platform: string
  osType: string
  osRelease: string
  arch: string
  ip: string
  runtime: {
    name: string
    version: string
    startTime: string
    uptime: number
    home: string
    projectPath: string
    args: string[]
  }
  processMemory: {
    rss: number
    heapTotal: number
    heapUsed: number
  }
  cpuCount: number
  cpuModel: string
  cpuUserPct: number
  cpuSysPct: number
  cpuIdlePct: number
  totalMemory: number
  usedMemory: number
  freeMemory: number
  memoryPct: number
  uptime: number
  nodeVersion: string
  pid: number
  cwd: string
  disks: DiskInfo[]
  nodes: Array<{
    name: string
    type: string
    status: string
    cpuPct: number
    memUsed: number
    memTotal: number
  }>
  collectedAt: string
}

export interface RedisCommandStat {
  name: string
  count: number
  pct: number
}

export interface RedisInfo {
  status: 'connected' | 'disconnected'
  message?: string
  version?: string
  mode?: string
  port?: number
  clients?: number
  uptimeSeconds?: number
  uptimeDays?: number
  usedMemory?: number
  usedMemoryHuman?: string
  maxMemory?: number
  maxMemoryHuman?: string
  memoryPct?: number
  cpuPct?: number
  aofEnabled?: boolean
  rdbLastStatus?: string
  keyCount?: number
  netInKbps?: number
  netOutKbps?: number
  commands?: RedisCommandStat[]
  collectedAt?: string
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (isLocalMode) {
    return mockRequest({
      counts: { cliffs: 13, coffins: 28, panoramas: 5, publishedNotices: 1, users: 3, onlineUsers: 1, operationLogs: 10, loginLogs: 8, resources: 8 },
      notices: [],
      resourceStats: [],
      loginTrend: [],
      recentOperations: [],
      onlineUserList: [],
      collectedAt: new Date().toISOString(),
    })
  }
  return request.get('/dashboard/summary') as Promise<DashboardSummary>
}

export async function getServerInfo(): Promise<ServerInfo> {
  if (isLocalMode) {
    return mockRequest({
      hostname: 'localhost',
      platform: 'local',
      osType: 'Local',
      osRelease: '',
      arch: '',
      ip: '127.0.0.1',
      runtime: { name: 'Mock', version: '', startTime: new Date(0).toISOString(), uptime: 0, home: '', projectPath: '', args: [] },
      processMemory: { rss: 0, heapTotal: 0, heapUsed: 0 },
      cpuCount: 1,
      cpuModel: 'Mock CPU',
      cpuUserPct: 0,
      cpuSysPct: 0,
      cpuIdlePct: 100,
      totalMemory: 0,
      usedMemory: 0,
      freeMemory: 0,
      memoryPct: 0,
      uptime: 0,
      nodeVersion: '',
      pid: 0,
      cwd: '',
      disks: [],
      nodes: [],
      collectedAt: new Date().toISOString(),
    })
  }
  return request.get('/monitor/server') as Promise<ServerInfo>
}

export async function getRedisInfo(): Promise<RedisInfo> {
  if (isLocalMode) {
    return mockRequest({ status: 'disconnected', message: '本地模式未连接 Redis' })
  }
  return request.get('/monitor/redis') as Promise<RedisInfo>
}

export type { Role, Post, Dept, MenuItem } from '@/data/admin-store'

export { getDeptName, getRoleNames, getPostNames, fmtDate }
