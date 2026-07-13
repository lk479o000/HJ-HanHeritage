import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'

export interface UserMenu {
  id: string
  name: string
  icon: string | null
  path: string | null
  component: string | null
  parentId: string | null
  type: string
  sort: number
  perms: string | null
}

export interface UserInfo {
  id: string
  account: string
  name: string
  phone: string | null
  email: string | null
  avatar: string | null
  createdAt: string
  dept: { id: string; name: string } | null
  roles: { id: string; name: string; code: string }[]
  menus: UserMenu[]
  permissions: string[]
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])
  const menus = ref<UserMenu[]>([])

  function setToken(val: string) {
    token.value = val
    localStorage.setItem(TOKEN_KEY, val)
  }

  function setRefreshToken(val: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, val)
  }

  function setUserInfo(info: Record<string, unknown>) {
    const ui = info as unknown as UserInfo
    userInfo.value = ui
    permissions.value = ui.permissions || []
    menus.value = ui.menus || []
  }

  function displayName() {
    const info = userInfo.value
    return info?.name || info?.account || '管理员'
  }

  function hasPerm(perm: string): boolean {
    if (isAdmin()) return true
    return permissions.value.includes(perm)
  }

  function hasAnyPerm(perms: string[]): boolean {
    if (isAdmin()) return true
    return perms.some((p) => permissions.value.includes(p))
  }

  function isAdmin(): boolean {
    return userInfo.value?.roles?.some((r) => r.code === 'SYS_ADMIN') ?? false
  }

  function getMenuPaths(): string[] {
    return menus.value
      .filter((m) => m.path)
      .map((m) => m.path!)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    menus.value = []
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  function isLoggedIn() {
    return !!token.value
  }

  return {
    token,
    userInfo,
    permissions,
    menus,
    setToken,
    setRefreshToken,
    setUserInfo,
    displayName,
    hasPerm,
    hasAnyPerm,
    isAdmin,
    getMenuPaths,
    logout,
    isLoggedIn,
  }
})
