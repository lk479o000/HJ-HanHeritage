import axios from 'axios'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

async function get<T>(url: string): Promise<T> {
  const res = await http.get(url)
  const body = res.data
  if (body?.code !== 200) {
    throw new Error(body?.message || '请求失败')
  }
  return body.data as T
}

export interface VisitorCliffImage {
  id: string
  cliffId: string
  imageUrl: string
  imageType: string
  sort: number
}

export interface VisitorCliff {
  id: string
  code: string
  name: string
  description: string
  mapLeft: number | null
  mapTop: number | null
  featured: number
  viewCount: number
  coffinCount: number
  order: number
  coverImage: string | null
  modelUrl: string | null
  images?: VisitorCliffImage[]
}

export interface VisitorCoffinImage {
  id: string
  coffinId: string
  imageUrl: string
  imageType: string
  sort: number
}

export interface VisitorCoffinModel {
  id: string
  coffinId: string
  modelUrl: string
  format: string
  fileSize: number
}

export interface VisitorCoffin {
  id: string
  code: string
  name: string
  description: string | null
  dynasty: string | null
  thumbnail: string | null
  cliffId: string | null
  cliff: { id: string; name: string } | null
  images: VisitorCoffinImage[]
  models: VisitorCoffinModel[]
  viewCount: number
  order: number
  mapLeft?: number | null
  mapTop?: number | null
}

export interface VisitorPanorama {
  id: string
  name: string
  category: string
  imageUrl: string | null
  description: string | null
  viewCount: number
}

export interface VisitorNotice {
  id: string
  title: string
  content: string
  contentHtml?: string
  scope: { type: string; ids: string[] }
  type: string
  publishedAt: string | null
}

export const getVisitorCliffs = () =>
  get<{ items: VisitorCliff[]; total: number }>('/visitor/cliffs')

export const getVisitorCliff = (id: string | number) =>
  get<any>(`/visitor/cliffs/${id}`)

export const getVisitorCoffins = () =>
  get<{ items: VisitorCoffin[]; total: number }>('/visitor/coffins')

export const getVisitorCoffin = (id: string | number) =>
  get<VisitorCoffin>(`/visitor/coffins/${id}`)

export const getVisitorPanoramas = () =>
  get<{ items: VisitorPanorama[]; total: number }>('/visitor/panoramas')

export async function getVisitorNotices(limit = 5) {
  const result = await get<{ items: any[]; total: number }>(`/visitor/notices?limit=${limit}`)
  return {
    ...result,
    items: result.items.map((item): VisitorNotice => ({
      ...item,
      scope: typeof item.scope === 'string' ? { type: item.scope, ids: [] } : item.scope,
    })),
  }
}

export interface VisitorEventPayload {
  event: string
  page: string
  targetId?: string | number
  detail?: string
}

function getVisitorId(): string {
  let id = localStorage.getItem('visitor_id')
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('visitor_id', id)
  }
  return id
}

export function trackVisitor(payload: VisitorEventPayload) {
  const body = { visitorId: getVisitorId(), ...payload, targetId: payload.targetId?.toString() }
  http.post('/visitor/events', body).catch(() => {
    // 埋点失败不阻断游客端页面
  })
}
