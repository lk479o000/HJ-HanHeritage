import request from '@/utils/request'

export function chat(data: { question: string; conversationId?: string }) {
  return request.post('/ai/chat', data)
}

export function recognize(data: FormData) {
  return request.post('/ai/recognize', data)
}

export function getChatHistory(params?: Record<string, any>) {
  return request.get('/ai/history', { params })
}
