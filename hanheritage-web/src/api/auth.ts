import request from '@/utils/request'
import { mockAuth, createApiProxy } from '@/utils/mock'

export interface LoginResult {
  token: string
  refreshToken?: string
}

type AuthApi = typeof mockAuth

const realAuth: AuthApi = {
  login: async (data: { username: string; password: string }) => request.post('/auth/login', data),
  logout: async () => request.post('/auth/logout'),
  getUserInfo: async () => request.get('/auth/userInfo'),
  refreshToken: async () => request.post('/auth/refresh'),
  updatePassword: async (data: { oldPassword: string; newPassword: string }) => request.put('/auth/password', data),
}

const proxy = createApiProxy<AuthApi>(realAuth, mockAuth)

export const login = proxy.login
export const logout = proxy.logout
export const getUserInfo = proxy.getUserInfo
export const refreshToken = proxy.refreshToken
export const updatePassword = proxy.updatePassword