import request from '@/utils/request'
import { mockRequest, isLocalMode } from '@/utils/mock'
import { RESOURCE_TYPES } from '@/data/admin-store'

export interface ResourceVo {
  id: string
  name: string
  type: string
  size: string
  updatedAt: string
  folderId: string
  status: string
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
  { id: 'r1', name: '大耳朵_M1_外景.glb', type: 'model', size: '45.2 MB', updatedAt: '2026-03-15', folderId: 'f1-1-1', status: 'normal' },
  { id: 'r2', name: '大耳朵_M1_正面.jpg', type: 'image', size: '8.5 MB', updatedAt: '2026-03-15', folderId: 'f1-1-2', status: 'normal' },
  { id: 'r3', name: '大耳朵_M1_侧面.jpg', type: 'image', size: '7.8 MB', updatedAt: '2026-03-15', folderId: 'f1-1-2', status: 'normal' },
  { id: 'r4', name: '大耳朵_M1_扫描.obj', type: 'scan', size: '120 MB', updatedAt: '2026-03-10', folderId: 'f1-1-3', status: 'normal' },
  { id: 'r5', name: '1号棺_整体.glb', type: 'model', size: '38.6 MB', updatedAt: '2026-02-20', folderId: 'f2-1-1', status: 'normal' },
  { id: 'r6', name: '1号棺_正面.jpg', type: 'image', size: '6.2 MB', updatedAt: '2026-02-20', folderId: 'f2-1-2', status: 'normal' },
  { id: 'r7', name: '1号棺_登记表.pdf', type: 'doc', size: '1.2 MB', updatedAt: '2026-02-18', folderId: 'f2-1-3', status: 'normal' },
  { id: 'r8', name: '2号棺_整体.glb', type: 'model', size: '42.1 MB', updatedAt: '2026-02-15', folderId: 'f2-2-1', status: 'normal' },
  { id: 'r9', name: '博物馆大厅_全景.jpg', type: 'image', size: '15.3 MB', updatedAt: '2026-01-28', folderId: 'f3-3', status: 'normal' },
  { id: 'r10', name: '航拍_大耳朵_全景.jpg', type: 'image', size: '22.1 MB', updatedAt: '2026-01-25', folderId: 'f3-1', status: 'normal' },
  { id: 'r11', name: '点云_M1.las', type: 'pointcloud', size: '350 MB', updatedAt: '2026-01-10', folderId: 'f1-1-3', status: 'normal' },
  { id: 'r12', name: '保护规划报告.pdf', type: 'doc', size: '5.8 MB', updatedAt: '2025-12-20', folderId: 'f4-1', status: 'normal' },
  { id: 'r13', name: '展厅导览视频.mp4', type: 'video', size: '180 MB', updatedAt: '2025-12-15', folderId: 'f4-2', status: 'normal' },
  { id: 'r14', name: '成果数据包.zip', type: 'deliverable', size: '2.1 GB', updatedAt: '2025-12-10', folderId: 'f4-2', status: 'normal' },
]

let localStore = [...mockFiles]

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

function transformResourceFromApi(r: any): ResourceVo {
  return {
    id: r.id,
    name: r.name,
    type: r.type || '',
    size: r.fileSize ? formatFileSize(r.fileSize) : '',
    updatedAt: r.updatedAt ? r.updatedAt.slice(0, 10) : '',
    folderId: r.parentId != null ? String(r.parentId) : '',
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
      filtered = filtered.filter(f => f.name.toLowerCase().includes(kw))
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

export async function deleteResource(id: string): Promise<{ deleted: number }> {
  if (isLocalMode) {
    localStore = localStore.filter(f => f.id !== id)
    return mockRequest({ deleted: 1 })
  }
  return request.delete(`/resources/${id}`) as Promise<{ deleted: number }>
}

export async function uploadResourceFile(file: File, folderId: string, type: string): Promise<ResourceVo> {
  if (isLocalMode) {
    const newResource: ResourceVo = {
      id: 'r' + Date.now(),
      name: file.name,
      type,
      size: formatFileSize(file.size),
      updatedAt: new Date().toISOString().slice(0, 10),
      folderId,
      status: 'normal',
    }
    localStore.push(newResource)
    return mockRequest(newResource)
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderId', folderId)
  formData.append('type', type)
  const res = await request.post('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return transformResourceFromApi(res)
}

export const RESOURCE_TYPE_OPTIONS = RESOURCE_TYPES
