import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore, type UserMenu } from '@/stores/user'

interface SidebarMenuGroup {
  group: string
  icon: string
  items: { id: string; path: string; label: string; icon: string }[]
}

export const useMenuStore = defineStore('menu', () => {
  const menuItems = ref<SidebarMenuGroup[]>([])
  const loading = ref(false)
  const lastUpdated = ref(0)

  const iconMap: Record<string, string> = {
    'home-filled': 'home-filled',
    'data-board': 'data-board',
    'map-location': 'map-location',
    'box': 'box',
    'picture': 'picture',
    'folder-opened': 'folder-opened',
    'user-filled': 'user-filled',
    'user': 'user',
    'key': 'key',
    'office-building': 'office-building',
    'suitcase': 'suitcase',
    'list': 'list',
    'notebook': 'notebook',
    'alarm-clock': 'alarm-clock',
    'connection': 'connection',
    'monitor': 'monitor',
    'cpu': 'cpu',
    'coin': 'coin',
    'setting': 'setting',
    'menu': 'menu',
    'bell': 'bell',
    'avatar': 'avatar',
  }

  function buildMenuFromUserMenus(userMenus: UserMenu[]): SidebarMenuGroup[] {
    const dirMenus = userMenus
      .filter((m) => m.type === 'dir')
      .sort((a, b) => a.sort - b.sort)

    const leafMenus = userMenus
      .filter((m) => m.type === 'menu' || m.type === 'page')
      .sort((a, b) => a.sort - b.sort)

    const groups: SidebarMenuGroup[] = []

    for (const dir of dirMenus) {
      const children = leafMenus.filter((m) => m.parentId === dir.id)
      if (children.length === 0) continue

      const items = children.map((child) => {
        const linkId = child.path ? child.path.replace(/^\/admin\//, '') : ''
        return {
          id: child.id,
          path: child.path || `/admin/${linkId}`,
          label: child.name,
          icon: child.icon || '',
        }
      })

      groups.push({
        group: dir.name,
        icon: dir.icon || '',
        items,
      })
    }

    const orphanLeaves = leafMenus.filter(
      (m) => !m.parentId || !dirMenus.some((d) => d.id === m.parentId),
    )
    if (orphanLeaves.length > 0) {
      const items = orphanLeaves.map((child) => {
        const linkId = child.path ? child.path.replace(/^\/admin\//, '') : ''
        return {
          id: child.id,
          path: child.path || `/admin/${linkId}`,
          label: child.name,
          icon: child.icon || '',
        }
      })
      groups.push({
        group: '其他',
        icon: 'menu',
        items,
      })
    }

    return groups
  }

  const defaultMenuItems: SidebarMenuGroup[] = [
    { group: '账户', icon: 'avatar', items: [
      { id: 'profile', path: '/admin/profile', label: '个人信息', icon: 'user-filled' },
    ]},
  ]

  async function loadMenuItems() {
    loading.value = true
    try {
      const userStore = useUserStore()

      if (userStore.isAdmin()) {
        const { getMenuTree } = await import('@/api/system')
        const tree = await getMenuTree()
        const transformed = transformMenuTree(tree)
        if (transformed.length > 0) {
          menuItems.value = transformed
        } else {
          menuItems.value = defaultMenuItems
        }
      } else if (userStore.menus.length > 0) {
        const built = buildMenuFromUserMenus(userStore.menus)
        if (built.length > 0) {
          menuItems.value = built
        } else {
          menuItems.value = defaultMenuItems
        }
      } else {
        menuItems.value = defaultMenuItems
      }
      lastUpdated.value = Date.now()
    } catch {
      menuItems.value = defaultMenuItems
    } finally {
      loading.value = false
    }
  }

  function transformMenuTree(tree: any[]): SidebarMenuGroup[] {
    const groups: SidebarMenuGroup[] = []

    tree.forEach((menu) => {
      if (menu.status === 0) return
      if (menu.children && menu.children.length > 0) {
        const items = menu.children
          .filter((child: any) => child.status !== 0 && (child.linkId || child.path))
          .map((child: any) => {
            const linkId = child.linkId || (child.path ? child.path.replace(/^\/admin\//, '') : '')
            return {
              id: child.id,
              path: `/admin/${linkId}`,
              label: child.name,
              icon: child.icon || '',
            }
          })

        if (items.length > 0) {
          groups.push({
            group: menu.name,
            icon: menu.icon || '',
            items,
          })
        }
      }
    })

    return groups
  }

  function refreshMenu() {
    loadMenuItems()
  }

  return { menuItems, loading, lastUpdated, loadMenuItems, refreshMenu, defaultMenuItems }
})
