import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/user'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 游客端不加载 Element Plus，使用轻量提示
function notifyError(message: string) {
  let container = document.getElementById('app-toast')
  if (!container) {
    container = document.createElement('div')
    container.id = 'app-toast'
    Object.assign(container.style, {
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      zIndex: '9999',
      pointerEvents: 'none',
    })
    document.body.appendChild(container)
  }
  const item = document.createElement('div')
  item.textContent = message
  Object.assign(item.style, {
    padding: '10px 16px',
    borderRadius: '6px',
    background: 'rgba(245, 108, 108, 0.95)',
    color: '#fff',
    fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
  })
  container.appendChild(item)
  setTimeout(() => item.remove(), 2500)
}

const service: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data
    if (code === 200) {
      return data as any
    }
    notifyError(message || '请求失败')
    return Promise.reject(new Error(message))
  },
  (error) => {
    if (error.response?.status === 401) {
      useUserStore().logout()
      if (router.currentRoute.value.path !== '/admin/login') {
        router.replace({
          path: '/admin/login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    }
    notifyError(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
