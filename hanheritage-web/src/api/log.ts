import request from '@/utils/request'
import { mockRequest } from '@/utils/mock'
import { operationLogs as mockLogs, fmtDate } from '@/data/admin-store'

export interface OperationLogVo {
  id: string
  at: number
  userDisplay: string
  module: string
  action: string
  detail: string
  ip: string
}

export interface OperationLogPageResult {
  items: OperationLogVo[]
  total: number
  page: number
  pageSize: number
}

export interface OperationLogQuery {
  page?: number
  pageSize?: number
  keyword?: string
  startTime?: string
  endTime?: string
}

const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true'

let localStore = [...mockLogs]

function filterLocalLogs(query: OperationLogQuery): OperationLogVo[] {
  let list: OperationLogVo[] = localStore.map(l => ({
    id: l.id,
    at: l.at,
    userDisplay: l.userDisplay,
    module: l.module,
    action: l.action,
    detail: l.detail,
    ip: l.ip,
  }))

  const kw = query.keyword?.trim().toLowerCase()
  if (kw) {
    list = list.filter(l => {
      const blob = `${l.userDisplay}${l.module}${l.action}${l.detail}${l.ip}`.toLowerCase()
      return blob.includes(kw)
    })
  }

  if (query.startTime || query.endTime) {
    list = list.filter(l => {
      if (query.startTime) {
        const start = new Date(query.startTime)
        start.setHours(0, 0, 0, 0)
        if (l.at < start.getTime()) return false
      }
      if (query.endTime) {
        const end = new Date(query.endTime)
        end.setHours(23, 59, 59, 999)
        if (l.at > end.getTime()) return false
      }
      return true
    })
  }

  return list.sort((a, b) => b.at - a.at)
}

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}

export async function getOperationLogs(query: OperationLogQuery = {}): Promise<OperationLogPageResult> {
  if (isLocalMode) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const filtered = filterLocalLogs(query)
    return mockRequest({
      items: paginate(filtered, page, pageSize),
      total: filtered.length,
      page,
      pageSize,
    })
  }

  return request.get('/logs/operations', { params: query })
}

export interface OperationLogExportResult {
  items: OperationLogVo[]
  total: number
}

export interface OperationLogDeleteResult {
  deleted: number
}

export async function exportOperationLogs(
  query: Omit<OperationLogQuery, 'page' | 'pageSize'> = {},
): Promise<OperationLogExportResult> {
  if (isLocalMode) {
    const items = filterLocalLogs(query)
    return mockRequest({ items, total: items.length })
  }

  return request.get('/logs/operations/export', { params: query }) as Promise<OperationLogExportResult>
}

export async function deleteOperationLog(id: string): Promise<OperationLogDeleteResult> {
  if (isLocalMode) {
    localStore = localStore.filter(l => l.id !== id)
    return mockRequest({ deleted: 1 })
  }

  return request.delete(`/logs/operations/${id}`) as Promise<OperationLogDeleteResult>
}

export async function deleteOperationLogs(ids: string[]): Promise<OperationLogDeleteResult> {
  if (isLocalMode) {
    const set = new Set(ids)
    const before = localStore.length
    localStore = localStore.filter(l => !set.has(l.id))
    return mockRequest({ deleted: before - localStore.length })
  }

  return request.delete('/logs/operations/batch', { data: { ids } }) as Promise<OperationLogDeleteResult>
}

export async function clearOperationLogs(): Promise<OperationLogDeleteResult> {
  if (isLocalMode) {
    const deleted = localStore.length
    localStore = []
    return mockRequest({ deleted })
  }

  return request.delete('/logs/operations/clear') as Promise<OperationLogDeleteResult>
}

export { fmtDate }
