import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { CLIFF_BASE, MAP_MARKERS_13, LEVEL_OPTIONS, CATEGORY_OPTIONS, TOWN_OPTIONS } from '@/data/admin-store'

export interface CliffImageVo {
  id?: string
  imageUrl: string
  imageType?: string
  sort?: number
}

export interface CliffVo {
  id: string
  code?: string
  name: string
  status: string
  town: string
  address?: string
  lng?: string
  lat?: string
  area?: string
  level?: string
  era?: string
  category?: string
  protectionUnitName?: string
  composition?: string
  intro?: string
  coverImage?: string
  modelUrl?: string
  mapLeft?: string
  mapTop?: string
  featured?: boolean
  images?: CliffImageVo[]
}

export interface CliffPageResult {
  items: CliffVo[]
  total: number
  page: number
  pageSize: number
}

export interface CliffQuery {
  page?: number
  pageSize?: number
  keyword?: string
  level?: string
  town?: string
  status?: string
}

const LEVEL_MAP: Record<string, string> = {
  national: '全国重点文物保护单位',
  provincial: '省级文物保护单位',
  city: '市级文物保护单位',
  county: '市级和县级文物保护单位',
}
const LEVEL_REVERSE: Record<string, string> = {
  '全国重点文物保护单位': 'national',
  '省级文物保护单位': 'provincial',
  '市级文物保护单位': 'city',
  '市级和县级文物保护单位': 'county',
  '县级文物保护单位': 'county',
}
const CATEGORY_MAP: Record<string, string> = {
  ordinary: '普通墓葬',
  cliff: '崖墓',
}
const CATEGORY_REVERSE: Record<string, string> = {
  '普通墓葬': 'ordinary',
  '崖墓': 'cliff',
}

export interface EntranceVo {
  id: string
  cliffId?: string
  x?: number | null
  y?: number | null
  z?: number | null
  direction?: string
  intro?: string
}

export interface EntrancePageResult {
  items: EntranceVo[]
  total: number
  page: number
  pageSize: number
}

const mockCliffs: CliffVo[] = CLIFF_BASE.map((c, i) => ({
  id: String(i + 1),
  status: 'enabled',
  ...c,
  level: c.level || (i % 3 === 0 ? '全国重点文物保护单位' : i % 3 === 1 ? '省级文物保护单位' : '市级和县级文物保护单位'),
  era: c.era || '东汉',
  category: c.category || '普通墓葬',
}))

const mockEntrances: EntranceVo[] = [
  { id: 'e1', cliffId: '5', x: 0, y: 0, z: 0, direction: 'M1', intro: '墓口1，保存完好' },
  { id: 'e2', cliffId: '5', x: 0, y: 0, z: 0, direction: 'M2', intro: '墓口2，轻微风化' },
  { id: 'e3', cliffId: '5', x: 0, y: 0, z: 0, direction: 'M3', intro: '墓口3，保存完好' },
  { id: 'e4', cliffId: '5', x: 0, y: 0, z: 0, direction: 'M4', intro: '墓口4，风化' },
  { id: 'e5', cliffId: '5', x: 0, y: 0, z: 0, direction: 'M5', intro: '墓口5，保存完好' },
]

let localCliffStore = [...mockCliffs]
let localEntranceStore = [...mockEntrances]

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function transformCliffFromApi(c: any): CliffVo {
  return {
    id: c.id,
    code: c.code || '',
    name: c.name,
    status: c.status === 0 ? 'disabled' : 'enabled',
    town: c.town || '',
    address: c.address || '',
    lng: c.lng != null ? String(c.lng) : '',
    lat: c.lat != null ? String(c.lat) : '',
    area: c.area != null ? String(c.area) : '',
    level: LEVEL_MAP[c.level] || c.level || '',
    era: c.dynasty || '',
    category: CATEGORY_MAP[c.category] || c.category || '',
    protectionUnitName: c.protectionUnitName || '',
    composition: c.composition || '',
    intro: c.description || '',
    coverImage: c.coverImage || '',
    modelUrl: c.modelUrl || '',
    mapLeft: c.mapLeft != null ? String(c.mapLeft) : '',
    mapTop: c.mapTop != null ? String(c.mapTop) : '',
    featured: c.featured === true || c.featured === 1,
    images: Array.isArray(c.images)
      ? c.images.map((img: any) => ({
          id: String(img.id),
          imageUrl: img.imageUrl,
          imageType: img.imageType || 'photo',
          sort: img.sort ?? 0,
        }))
      : [],
  }
}

function transformCliffToApi(data: Partial<CliffVo>): any {
  const payload: any = {}
  if (data.code !== undefined) payload.code = data.code
  if (data.name !== undefined) payload.name = data.name
  if (data.status !== undefined) payload.status = data.status === 'disabled' ? 0 : 1
  if (data.town !== undefined) payload.town = data.town
  if (data.era !== undefined) payload.dynasty = data.era
  if (data.lng !== undefined) payload.lng = data.lng ? Number(data.lng) : null
  if (data.lat !== undefined) payload.lat = data.lat ? Number(data.lat) : null
  if (data.area !== undefined) payload.area = data.area ? Number(data.area) : null
  if (data.level !== undefined) payload.level = LEVEL_REVERSE[data.level] || data.level
  if (data.category !== undefined) payload.category = CATEGORY_REVERSE[data.category] || data.category
  if (data.intro !== undefined) payload.description = data.intro
  if (data.address !== undefined) payload.address = data.address
  if (data.protectionUnitName !== undefined) payload.protectionUnitName = data.protectionUnitName
  if (data.composition !== undefined) payload.composition = data.composition
  if (data.coverImage !== undefined) payload.coverImage = data.coverImage
  if (data.modelUrl !== undefined) payload.modelUrl = data.modelUrl
  if (data.mapLeft !== undefined) payload.mapLeft = data.mapLeft ? Number(data.mapLeft) : null
  if (data.mapTop !== undefined) payload.mapTop = data.mapTop ? Number(data.mapTop) : null
  if (data.featured !== undefined) payload.featured = data.featured ? 1 : 0
  if (data.images !== undefined) {
    payload.images = data.images.map((img, index) => ({
      imageUrl: img.imageUrl,
      imageType: img.imageType || 'photo',
      sort: img.sort ?? index,
    }))
  }
  return payload
}

export async function getCliffList(query: CliffQuery = {}): Promise<CliffPageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localCliffStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(kw) || c.town.toLowerCase().includes(kw))
    }
    if (query.level) {
      filtered = filtered.filter(c => c.level === query.level)
    }
    if (query.town) {
      filtered = filtered.filter(c => c.town === query.town)
    }
    if (query.status) {
      filtered = filtered.filter(c => c.status === query.status)
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/cliffs', { params: query }) as CliffPageResult
  const items = (res.items || []).map(transformCliffFromApi)
  return { ...res, items }
}

export async function getCliffDetail(id: string): Promise<CliffVo> {
  if (isLocalMode) {
    const cliff = localCliffStore.find(c => c.id === id)
    return mockRequest(cliff || ({} as CliffVo))
  }
  const res = await request.get(`/cliffs/${id}`)
  return transformCliffFromApi(res)
}

export interface CliffModelCheckResult {
  reachable: boolean
  message: string
}

export async function checkCliffModelUrl(url: string): Promise<CliffModelCheckResult> {
  if (isLocalMode) {
    return mockRequest<CliffModelCheckResult>({ reachable: true, message: '本地模式跳过校验' })
  }
  return request.get('/cliffs/model/check', { params: { url } }) as Promise<CliffModelCheckResult>
}

export async function createCliff(data: Partial<CliffVo>): Promise<CliffVo> {
  if (isLocalMode) {
    const item: CliffVo = { id: 'c' + Date.now(), name: data.name || '', status: data.status || 'enabled', town: data.town || '', ...data }
    localCliffStore.push(item)
    return mockRequest(item)
  }
  const payload = transformCliffToApi(data)
  const res = await request.post('/cliffs', payload)
  return transformCliffFromApi(res)
}

export async function updateCliff(id: string, data: Partial<CliffVo>): Promise<CliffVo> {
  if (isLocalMode) {
    const idx = localCliffStore.findIndex(c => c.id === id)
    if (idx >= 0) {
      localCliffStore[idx] = { ...localCliffStore[idx], ...data }
      return mockRequest(localCliffStore[idx])
    }
    return mockRequest({} as CliffVo)
  }
  const payload = transformCliffToApi(data)
  const res = await request.put(`/cliffs/${id}`, payload)
  return transformCliffFromApi(res)
}

export async function deleteCliff(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localCliffStore = localCliffStore.filter(c => c.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/cliffs/${id}`) as Promise<{ deleted: number }>
}

export async function getEntrances(
  query: { page?: number; pageSize?: number; cliffId?: string } = {},
): Promise<EntrancePageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const list = query.cliffId
      ? localEntranceStore.filter(e => e.cliffId === query.cliffId)
      : localEntranceStore
    return mockRequest({ items: paginate(list, page, pageSize), total: list.length, page, pageSize })
  }
  return request.get('/cliffs/entrances', { params: query })
}

export async function createEntrance(cliffId: string, data: Partial<EntranceVo>): Promise<EntranceVo> {
  if (isLocalMode) {
    const item: EntranceVo = { id: 'e' + Date.now(), cliffId, ...data }
    localEntranceStore.push(item)
    return mockRequest(item)
  }
  return request.post(`/cliffs/${cliffId}/entrances`, data)
}

export async function updateEntrance(id: string, data: Partial<EntranceVo>): Promise<EntranceVo> {
  if (isLocalMode) {
    const idx = localEntranceStore.findIndex(e => e.id === id)
    if (idx >= 0) {
      localEntranceStore[idx] = { ...localEntranceStore[idx], ...data }
      return mockRequest(localEntranceStore[idx])
    }
    return mockRequest({} as EntranceVo)
  }
  return request.put(`/cliffs/entrances/${id}`, data)
}

export async function deleteEntrance(id: string, cliffId?: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localEntranceStore = localEntranceStore.filter(e => e.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(cliffId ? `/cliffs/${cliffId}/entrances/${id}` : `/cliffs/entrances/${id}`) as Promise<{ deleted: number }>
}

export { LEVEL_OPTIONS, CATEGORY_OPTIONS, TOWN_OPTIONS, MAP_MARKERS_13 }
