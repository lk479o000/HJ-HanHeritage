import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { CLIFF_BASE, MAP_MARKERS_13, LEVEL_OPTIONS, CATEGORY_OPTIONS, TOWN_OPTIONS } from '@/data/admin-store'

export interface CliffVo {
  id: string
  name: string
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
}

export interface EntranceVo {
  id: string
  name: string
  direction: string
  width: string
  height: string
  depth: string
  shape: string
  status: string
}

export interface EntrancePageResult {
  items: EntranceVo[]
  total: number
  page: number
  pageSize: number
}

const mockCliffs: CliffVo[] = CLIFF_BASE.map((c, i) => ({
  id: String(i + 1),
  ...c,
  level: c.level || (i % 3 === 0 ? '全国重点文物保护单位' : i % 3 === 1 ? '省级文物保护单位' : '市级和县级文物保护单位'),
  era: c.era || '东汉',
  category: c.category || '普通墓葬',
}))

const mockEntrances: EntranceVo[] = [
  { id: 'e1', name: 'M1', direction: '南', width: '1.8', height: '2.1', depth: '4.5', shape: '长方形', status: '完好' },
  { id: 'e2', name: 'M2', direction: '南偏西', width: '1.6', height: '1.9', depth: '3.8', shape: '长方形', status: '轻微风化' },
  { id: 'e3', name: 'M3', direction: '南', width: '2.0', height: '2.3', depth: '5.2', shape: '长方形', status: '完好' },
  { id: 'e4', name: 'M4', direction: '东南', width: '1.5', height: '1.8', depth: '3.2', shape: '梯形', status: '风化' },
  { id: 'e5', name: 'M5', direction: '南', width: '1.9', height: '2.0', depth: '4.0', shape: '长方形', status: '完好' },
  { id: 'e6', name: 'M6', direction: '南偏东', width: '1.7', height: '2.2', depth: '4.8', shape: '长方形', status: '轻微风化' },
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
    name: c.name,
    town: '',
    address: c.address || '',
    lng: c.lng != null ? String(c.lng) : '',
    lat: c.lat != null ? String(c.lat) : '',
    area: c.area || '',
    level: c.level || '',
    era: c.dynasty || '',
    category: c.category || '',
    protectionUnitName: c.protectionUnitName || '',
    composition: c.composition || '',
    intro: c.description || '',
  }
}

function transformCliffToApi(data: Partial<CliffVo>): any {
  const payload: any = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.era !== undefined) payload.dynasty = data.era
  if (data.lng !== undefined) payload.lng = data.lng ? Number(data.lng) : null
  if (data.lat !== undefined) payload.lat = data.lat ? Number(data.lat) : null
  if (data.area !== undefined) payload.area = data.area
  if (data.level !== undefined) payload.level = data.level
  if (data.category !== undefined) payload.category = data.category
  if (data.intro !== undefined) payload.description = data.intro
  if (data.address !== undefined) payload.address = data.address
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

export async function createCliff(data: Partial<CliffVo>): Promise<CliffVo> {
  if (isLocalMode) {
    const item: CliffVo = { id: 'c' + Date.now(), name: data.name || '', town: data.town || '', ...data }
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

export async function getEntrances(query: { page?: number; pageSize?: number } = {}): Promise<EntrancePageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    return mockRequest({ items: paginate(localEntranceStore, page, pageSize), total: localEntranceStore.length, page, pageSize })
  }
  return request.get('/cliffs/entrances', { params: query })
}

export async function createEntrance(data: Partial<EntranceVo>): Promise<EntranceVo> {
  if (isLocalMode) {
    const item: EntranceVo = { id: 'e' + Date.now(), name: data.name || '', direction: data.direction || '', width: data.width || '', height: data.height || '', depth: data.depth || '', shape: data.shape || '', status: data.status || '完好' }
    localEntranceStore.push(item)
    return mockRequest(item)
  }
  return request.post('/cliffs/entrances', data)
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

export async function deleteEntrance(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localEntranceStore = localEntranceStore.filter(e => e.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/cliffs/entrances/${id}`) as Promise<{ deleted: number }>
}

export { LEVEL_OPTIONS, CATEGORY_OPTIONS, TOWN_OPTIONS, MAP_MARKERS_13 }
