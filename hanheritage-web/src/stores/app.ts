import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const activeMenuId = ref('dashboard')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setActiveMenu(id: string) {
    activeMenuId.value = id
  }

  return { sidebarCollapsed, activeMenuId, toggleSidebar, setActiveMenu }
})
