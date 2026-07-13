import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { COFFIN_TITLES, COFFIN_REGISTRY_FIELDS, EDIT_SECTIONS } from '@/data/admin-store'

export interface CoffinVo {
  id: string
  title: string
  registryType: string
  collectionId: string
  code: string
  tombGroup: string
  eraCategory: string
  dynasty: string
  artifactCategory: string
  textureType: string
  materialCategory: string
  quantity: number
  dimLength: string
  dimWidth: string
  dimHeight: string
  relicGrade: string
  completeness: string
  preservationStatus: string
  sourceType: string
  [key: string]: any
}

export interface CoffinPageResult {
  items: CoffinVo[]
  total: number
  page: number
  pageSize: number
}

export interface CoffinQuery {
  page?: number
  pageSize?: number
  keyword?: string
  relicGrade?: string
}

const GRADES = ['一级文物', '二级文物', '三级文物', '一般文物', '未定级']

function makeCoffin(idx: number): CoffinVo {
  return {
    id: `cf${idx + 1}`,
    title: COFFIN_TITLES[idx] || `${idx + 1}号棺`,
    originalName: COFFIN_TITLES[idx] || '',
    registryType: '石棺',
    collectionId: `HJ-SG-${String(idx + 1).padStart(3, '0')}`,
    code: String(idx + 1),
    tombGroup: '大耳朵崖墓群',
    eraCategory: '历史年代',
    dynasty: '东汉',
    eraSpecific: '东汉中期',
    artifactCategory: '石刻',
    textureType: '石',
    materialCategory: '砂岩',
    materialSpecific: '红砂岩',
    quantity: 1,
    dimLength: String(180 + Math.floor(Math.random() * 40)),
    dimWidth: String(55 + Math.floor(Math.random() * 15)),
    dimHeight: String(60 + Math.floor(Math.random() * 20)),
    dimText: '',
    weightRange: '200-500kg',
    weightValue: '',
    weightUnit: 'kg',
    relicGrade: GRADES[idx % GRADES.length],
    sourceType: '考古发掘',
    sourceDetail: '',
    completeness: '完整',
    completenessDetail: '',
    preservationStatus: '稳定',
    accessionRange: '2010-2020',
    accessionYear: '2015',
  }
}

const mockCoffins: CoffinVo[] = COFFIN_TITLES.map((_, i) => makeCoffin(i))
let localStore = [...mockCoffins]

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function parseDimensions(dimensions: string): { dimLength: string; dimWidth: string; dimHeight: string } {
  if (!dimensions) return { dimLength: '', dimWidth: '', dimHeight: '' }
  const parts = dimensions.split(/[×xX*]/)
  return {
    dimLength: parts[0]?.trim() || '',
    dimWidth: parts[1]?.trim() || '',
    dimHeight: parts[2]?.trim() || '',
  }
}

function transformCoffinFromApi(c: any): CoffinVo {
  const dims = parseDimensions(c.dimensions || '')
  return {
    id: c.id,
    title: c.name || '',
    registryType: c.registryType || '石棺',
    collectionId: c.code || '',
    code: c.code || '',
    tombGroup: c.tombGroup || '',
    eraCategory: c.eraCategory || '',
    dynasty: c.dynasty || '',
    artifactCategory: c.artifactCategory || '',
    textureType: c.texture || '',
    materialCategory: c.materialCategory || c.texture || '',
    quantity: c.quantity ?? 1,
    dimLength: dims.dimLength,
    dimWidth: dims.dimWidth,
    dimHeight: dims.dimHeight,
    relicGrade: c.grade || '',
    completeness: c.completeness || '',
    preservationStatus: c.preservationStatus || '',
    sourceType: c.source || '',
  }
}

function transformCoffinToApi(data: Partial<CoffinVo>): any {
  const payload: any = {}
  if (data.title !== undefined) payload.name = data.title
  if (data.collectionId !== undefined) payload.code = data.collectionId
  if (data.relicGrade !== undefined) payload.grade = data.relicGrade
  if (data.sourceType !== undefined) payload.source = data.sourceType
  if (data.textureType !== undefined) payload.texture = data.textureType
  if (data.completeness !== undefined) payload.completeness = data.completeness
  if (data.dynasty !== undefined) payload.dynasty = data.dynasty
  if (data.registryType !== undefined) payload.registryType = data.registryType
  if (data.dimLength !== undefined || data.dimWidth !== undefined || data.dimHeight !== undefined) {
    const l = data.dimLength || ''
    const w = data.dimWidth || ''
    const h = data.dimHeight || ''
    payload.dimensions = [l, w, h].filter(Boolean).join('×')
  }
  return payload
}

export async function getCoffinList(query: CoffinQuery = {}): Promise<CoffinPageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(c => c.title.toLowerCase().includes(kw) || c.collectionId.toLowerCase().includes(kw))
    }
    if (query.relicGrade) {
      filtered = filtered.filter(c => c.relicGrade === query.relicGrade)
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/coffins', { params: query }) as CoffinPageResult
  const items = (res.items || []).map(transformCoffinFromApi)
  return { ...res, items }
}

export async function getCoffinDetail(id: string): Promise<CoffinVo> {
  if (isLocalMode) {
    const coffin = localStore.find(c => c.id === id)
    return mockRequest(coffin || ({} as CoffinVo))
  }
  const res = await request.get(`/coffins/${id}`)
  return transformCoffinFromApi(res)
}

export async function createCoffin(data: Partial<CoffinVo>): Promise<CoffinVo> {
  if (isLocalMode) {
    const item: CoffinVo = { id: 'cf' + Date.now(), title: data.title || '', registryType: '', collectionId: '', code: '', tombGroup: '', eraCategory: '', dynasty: '', artifactCategory: '', textureType: '', materialCategory: '', quantity: 1, dimLength: '', dimWidth: '', dimHeight: '', relicGrade: '', completeness: '', preservationStatus: '', sourceType: '', ...data }
    localStore.push(item)
    return mockRequest(item)
  }
  const payload = transformCoffinToApi(data)
  const res = await request.post('/coffins', payload)
  return transformCoffinFromApi(res)
}

export async function updateCoffin(id: string, data: Partial<CoffinVo>): Promise<CoffinVo> {
  if (isLocalMode) {
    const idx = localStore.findIndex(c => c.id === id)
    if (idx >= 0) {
      localStore[idx] = { ...localStore[idx], ...data }
      return mockRequest(localStore[idx])
    }
    return mockRequest({} as CoffinVo)
  }
  const payload = transformCoffinToApi(data)
  const res = await request.put(`/coffins/${id}`, payload)
  return transformCoffinFromApi(res)
}

export async function deleteCoffin(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localStore = localStore.filter(c => c.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/coffins/${id}`) as Promise<{ deleted: number }>
}

export { COFFIN_REGISTRY_FIELDS, EDIT_SECTIONS }
