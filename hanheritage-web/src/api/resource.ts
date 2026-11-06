import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { RESOURCE_TYPES } from '@/data/admin-store'

export interface ResourceVo {
  id: string
  name: string
  type: string
  size: string
  fileSize: number
  updatedAt: string
  folderId: string
  fileUrl: string
  mimeType: string
  remark: string
  status: string
}

export interface ResourceNode {
  id: string
  name: string
  type: string
  parentId: string
  fileSize: number
  fileUrl: string
  mimeType: string
  remark: string
  updatedAt: string
  children?: ResourceNode[]
}

export interface ResourcePageResult {
  items: ResourceVo[]
  total: number
  page: number
  pageSize: number
}

export interface ResourceQuery {
  page?: number
  pageSize?: number
  keyword?: string
  type?: string
  folderId?: string
}

const mockFiles: ResourceVo[] = [
  { id: 'r1', name: '大耳朵_M1_外景.glb', type: 'model', size: '45.2 MB', fileSize: 47400000, updatedAt: '2026-03-15', folderId: 'f1-1-1', fileUrl: '', mimeType: 'model/gltf-binary', remark: '三维模型', status: 'normal' },
]

let localStore = [...mockFiles]

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

function transformResourceFromApi(r: any): ResourceVo {
  return {
    id: String(r.id),
    name: r.name,
    type: r.type || '',
    size: r.fileSize ? formatFileSize(r.fileSize) : '—',
    fileSize: r.fileSize || 0,
    updatedAt: r.updatedAt ? r.updatedAt.slice(0, 10) : '',
    folderId: r.parentId != null ? String(r.parentId) : '0',
    fileUrl: r.fileUrl || '',
    mimeType: r.mimeType || '',
    remark: r.remark || '',
    status: 'normal',
  }
}

export async function getResourceList(query: ResourceQuery = {}): Promise<ResourcePageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    let filtered = [...localStore]
    const kw = query.keyword?.trim().toLowerCase()
    if (kw) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(kw) || f.remark.toLowerCase().includes(kw))
    }
    if (query.type) {
      filtered = filtered.filter(f => f.type === query.type)
    }
    if (query.folderId) {
      filtered = filtered.filter(f => f.folderId === query.folderId)
    }
    return mockRequest({ items: paginate(filtered, page, pageSize), total: filtered.length, page, pageSize })
  }
  const res = await request.get('/resources', { params: query }) as ResourcePageResult
  const items = (res.items || []).map(transformResourceFromApi)
  return { ...res, items }
}

export async function getResourceTree(): Promise<ResourceNode[]> {
  if (isLocalMode) {
    return mockRequest([
      {
        id: 'f1', name: '崖墓群数据', type: 'folder', parentId: '0', fileSize: 0, fileUrl: '', mimeType: '', remark: '', updatedAt: '',
        children: [
          { id: 'f1-1', name: '大耳朵崖墓群', type: 'folder', parentId: 'f1', fileSize: 0, fileUrl: '', mimeType: '', remark: '', updatedAt: '', children: [] },
        ],
      },
    ])
  }
  return request.get('/resources/tree') as Promise<ResourceNode[]>
}

export async function deleteResource(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localStore = localStore.filter(f => f.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/resources/${id}`) as Promise<{ deleted: number }>
}

export async function deleteResources(ids: string[]): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localStore = localStore.filter(f => !ids.includes(f.id))
    return mockRequest({ deleted: ids.length })
  }
  return request.delete('/resources/batch', { data: { ids } }) as Promise<{ deleted: number }>
}

export async function createResource(payload: {
  name: string
  type: string
  parentId?: number
  fileUrl?: string
  fileSize?: number
  mimeType?: string
  remark?: string
}): Promise<ResourceVo> {
  if (isLocalMode) {
    const newResource: ResourceVo = {
      id: 'r' + Date.now(),
      name: payload.name,
      type: payload.type,
      size: formatFileSize(payload.fileSize || 0),
      fileSize: payload.fileSize || 0,
      updatedAt: new Date().toISOString().slice(0, 10),
      folderId: String(payload.parentId || '0'),
      fileUrl: payload.fileUrl || '',
      mimeType: payload.mimeType || '',
      remark: payload.remark || '',
      status: 'normal',
    }
    localStore.push(newResource)
    return mockRequest(newResource)
  }
  const res = await request.post('/resources', payload)
  return transformResourceFromApi(res)
}

export async function updateResource(id: string, payload: {
  name?: string
  type?: string
  parentId?: number
  fileUrl?: string
  fileSize?: number
  mimeType?: string
  remark?: string
}): Promise<ResourceVo> {
  if (isLocalMode) {
    const target = localStore.find(f => f.id === id)
    if (target) Object.assign(target, payload, { name: payload.name ?? target.name, remark: payload.remark ?? target.remark })
    return mockRequest(target as ResourceVo)
  }
  const res = await request.put(`/resources/${id}`, payload)
  return transformResourceFromApi(res)
}

export async function moveResource(id: string, targetParentId: number): Promise<ResourceVo> {
  if (isLocalMode) {
    const target = localStore.find(f => f.id === id)
    if (target) target.folderId = String(targetParentId)
    return mockRequest(target as ResourceVo)
  }
  const res = await request.put(`/resources/${id}/move`, { targetParentId })
  return transformResourceFromApi(res)
}

export async function uploadResourceFile(file: File, folderId: string, type: string, remark = ''): Promise<ResourceVo> {
  if (isLocalMode) {
    const newResource: ResourceVo = {
      id: 'r' + Date.now(),
      name: file.name,
      type,
      size: formatFileSize(file.size),
      fileSize: file.size,
      updatedAt: new Date().toISOString().slice(0, 10),
      folderId,
      fileUrl: '',
      mimeType: file.type,
      remark,
      status: 'normal',
    }
    localStore.push(newResource)
    return mockRequest(newResource)
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderId', folderId)
  formData.append('type', type)
  if (remark) formData.append('remark', remark)
  const res = await request.post('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return transformResourceFromApi(res)
}

export const RESOURCE_TYPE_OPTIONS = RESOURCE_TYPES
