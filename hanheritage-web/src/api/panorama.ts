import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { PANO_CATEGORIES } from '@/data/admin-store'

export interface PanoramaVo {
  id: string
  name: string
  category: string
  status: string
  description: string
}

export interface PanoramaPageResult {
  items: PanoramaVo[]
  total: number
  page: number
  pageSize: number
}

export interface PanoramaQuery {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
  status?: string
}

const mockScenes: PanoramaVo[] = [
  { id: 'p1', name: '博物馆大厅', category: 'inner', status: 'published', description: '博物馆一层大厅全景' },
  { id: 'p2', name: '展厅A', category: 'inner', status: 'published', description: '汉代画像石棺展厅' },
  { id: 'p3', name: '展厅B', category: 'inner', status: 'draft', description: '崖墓文化展厅' },
  { id: 'p4', name: '大耳朵崖墓群·航拍', category: 'air', status: 'published', description: '大耳朵崖墓群鸟瞰全景' },
  { id: 'p5', name: '笔架山·远眺', category: 'air', status: 'published', description: '笔架山公园远眺全景' },
  { id: 'p6', name: 'M1墓口·外景', category: 'ground', status: 'published', description: 'M1号墓口外部全景' },
  { id: 'p7', name: 'M3墓口·外景', category: 'ground', status: 'draft', description: 'M3号墓口外部全景' },
  { id: 'p8', name: 'M1墓室·内景', category: 'inner', status: 'published', description: 'M1号墓室内部全景' },
  { id: 'p9', name: '文物库房', category: 'inner', status: 'draft', description: '文物库房全景' },
  { id: 'p10', name: '合江县城·航拍', category: 'air', status: 'published', description: '合江县城鸟瞰全景' },
]

let localStore = [...mockScenes]

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function transformPanoramaFromApi(p: any): PanoramaVo {
  return {
    id: p.id,
    name: p.name,
    category: p.category || '',
    status: p.status === 1 ? 'published' : 'draft',
    description: p.description || '',
  }
}

function transformPanoramaToApi(data: Partial<PanoramaVo>): any {
  const payload: any = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.category !== undefined) payload.category = data.category
  if (data.description !== undefined) payload.description = data.description
  if (data.status !== undefined) payload.status = data.status === 'published' ? 1 : 0
  return payload
}

export async function getPanoramaList(query: PanoramaQuery = {}): Promise<PanoramaPageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(kw))
    }
    if (query.category) {
      filtered = filtered.filter(s => s.category === query.category)
    }
    if (query.status) {
      filtered = filtered.filter(s => s.status === query.status)
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/panoramas', { params: query }) as PanoramaPageResult
  const items = (res.items || []).map(transformPanoramaFromApi)
  return { ...res, items }
}

export async function createPanorama(data: Partial<PanoramaVo>): Promise<PanoramaVo> {
  if (isLocalMode) {
    const item: PanoramaVo = { id: 'p' + Date.now(), name: data.name || '', category: data.category || 'inner', status: data.status || 'draft', description: data.description || '' }
    localStore.push(item)
    return mockRequest(item)
  }
  const payload = transformPanoramaToApi(data)
  const res = await request.post('/panoramas', payload)
  return transformPanoramaFromApi(res)
}

export async function updatePanorama(id: string, data: Partial<PanoramaVo>): Promise<PanoramaVo> {
  if (isLocalMode) {
    const idx = localStore.findIndex(s => s.id === id)
    if (idx >= 0) {
      localStore[idx] = { ...localStore[idx], ...data }
      return mockRequest(localStore[idx])
    }
    return mockRequest({} as PanoramaVo)
  }
  const payload = transformPanoramaToApi(data)
  const res = await request.put(`/panoramas/${id}`, payload)
  return transformPanoramaFromApi(res)
}

export async function deletePanorama(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localStore = localStore.filter(s => s.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/panoramas/${id}`) as Promise<{ deleted: number }>
}

export async function uploadPanoramaFile(panoramaId: string, file: File): Promise<{ url: string }> {
  if (isLocalMode) {
    return mockRequest({ url: `/uploads/panorama/${panoramaId}/${file.name}` })
  }
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/panoramas/${panoramaId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as Promise<{ url: string }>
}

export { PANO_CATEGORIES }
