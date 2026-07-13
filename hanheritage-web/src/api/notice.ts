import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { defaultNotices, depts, roles, fmtDate } from '@/data/admin-store'
import type { Notice, NoticeScope } from '@/data/admin-store'
import dayjs from 'dayjs'

export interface NoticeVo {
  id: string
  title: string
  content: string
  contentHtml: string
  type: string
  status: string
  scope: NoticeScope
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NoticePageResult {
  items: NoticeVo[]
  total: number
  page: number
  pageSize: number
}

export interface NoticeQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}

let localStore: NoticeVo[] = defaultNotices.map(n => ({
  id: n.id,
  title: n.title,
  content: n.content,
  contentHtml: n.contentHtml,
  type: 'notice',
  status: n.status,
  scope: { ...n.scope, ids: [...n.scope.ids] },
  publishedAt: n.status === 'published' ? dayjs(n.updatedAt).format('YYYY-MM-DD') : null,
  createdAt: dayjs(n.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
  updatedAt: dayjs(n.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
}))

function filterLocalNotices(query: NoticeQuery): NoticeVo[] {
  let list = [...localStore]
  const kw = query.keyword?.trim().toLowerCase()
  if (kw) {
    list = list.filter(n => n.title.toLowerCase().includes(kw))
  }
  if (query.status) {
    list = list.filter(n => n.status === query.status)
  }
  return list.sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
}

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function transformApiItem(raw: any): NoticeVo {
  return {
    ...raw,
    scope: typeof raw.scope === 'string' ? { type: raw.scope, ids: [] } : raw.scope,
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt).getTime() : null,
    createdAt: raw.createdAt ? new Date(raw.createdAt).getTime() : 0,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).getTime() : 0,
  }
}

export async function getNotices(query: NoticeQuery = {}): Promise<NoticePageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const filtered = filterLocalNotices(query)
    return mockRequest({
      items: paginate(filtered, page, pageSize),
      total: filtered.length,
      page,
      pageSize,
    })
  }
  const res: any = await request.get('/notices', { params: query })
  return {
    items: (res.items || []).map(transformApiItem),
    total: res.total ?? 0,
    page: res.page ?? 1,
    pageSize: res.pageSize ?? 10,
  }
}

export async function createNotice(data: Partial<NoticeVo>): Promise<NoticeVo> {
  if (isLocalMode) {
    const item: NoticeVo = {
      id: 'n' + Date.now(),
      title: data.title || '',
      content: data.content || '',
      contentHtml: data.contentHtml || '',
      type: data.type || 'notice',
      status: data.status || 'draft',
      scope: data.scope || { type: 'all', ids: [] },
      publishedAt: data.status === 'published' ? dayjs().format('YYYY-MM-DD') : null,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    localStore.unshift(item)
    return mockRequest(item)
  }
  const payload: any = {
    ...data,
    scope: data.scope?.type || 'all',
    type: 'notice',
  }
  return request.post('/notices', payload)
}

export async function updateNotice(id: string, data: Partial<NoticeVo>): Promise<NoticeVo> {
  if (isLocalMode) {
    const idx = localStore.findIndex(n => n.id === id)
    if (idx >= 0) {
      localStore[idx] = { ...localStore[idx], ...data, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
      return mockRequest(localStore[idx])
    }
    return mockRequest({} as NoticeVo)
  }
  const payload: any = { ...data }
  if (data.scope !== undefined) {
    payload.scope = data.scope.type
  }
  return request.put(`/notices/${id}`, payload)
}

export async function publishNotice(id: string): Promise<any> {
  if (isLocalMode) {
    const idx = localStore.findIndex(n => n.id === id)
    if (idx >= 0) {
      localStore[idx].status = 'published'
      localStore[idx].publishedAt = dayjs().format('YYYY-MM-DD')
      localStore[idx].updatedAt = dayjs().format('YYYY-MM-DD')
      return mockRequest(localStore[idx])
    }
    return mockRequest({} as NoticeVo)
  }
  return request.put('/notices/' + id + '/publish')
}

export async function unpublishNotice(id: string): Promise<any> {
  if (isLocalMode) {
    const idx = localStore.findIndex(n => n.id === id)
    if (idx >= 0) {
      localStore[idx].status = 'draft'
      localStore[idx].publishedAt = null
      localStore[idx].updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
      return mockRequest(localStore[idx])
    }
    return mockRequest({} as NoticeVo)
  }
  return request.put('/notices/' + id + '/draft')
}

export async function deleteNotice(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localStore = localStore.filter(n => n.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/notices/${id}`) as Promise<{ deleted: number }>
}

export { fmtDate }
