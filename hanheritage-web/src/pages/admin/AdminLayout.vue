<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logout, getUserInfo } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import { ElTooltip } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

interface SidebarMenuGroup {
  group: string
  icon: string
  items: { id: string; path: string; label: string; icon: string }[]
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()
const sidebarCollapsed = ref(false)
const expandedGroups = ref<Record<string, boolean>>({})

function getIconComponent(iconName: string) {
  const pascalName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return (ElementPlusIconsVue as any)[pascalName] || null
}

async function ensureUserInfo() {
  if (userStore.isLoggedIn() && !userStore.userInfo) {
    try {
      const info = await getUserInfo()
      userStore.setUserInfo(info as Record<string, unknown>)
    } catch {
      userStore.logout()
      router.replace('/admin/login')
    }
  }
}

async function loadMenuItems() {
  await ensureUserInfo()
  await menuStore.loadMenuItems()
  for (const group of menuStore.menuItems) {
    expandedGroups.value[group.group] = isGroupHasActive(group)
  }
}

const activeMenu = computed(() => route.path)

function isItemActive(path: string) {
  return activeMenu.value === path
}

function isGroupHasActive(group: { items: { path: string }[] }) {
  return group.items.some(item => activeMenu.value === item.path)
}

function navigate(path: string) {
  router.push(path)
}

async function handleLogout() {
  try {
    await logout()
  } catch {
    // 本地仍退出
  }
  userStore.logout()
  router.replace('/admin/login')
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleGroup(group: string) {
  expandedGroups.value[group] = !expandedGroups.value[group]
}

function isGroupExpanded(group: string) {
  return expandedGroups.value[group] !== undefined ? expandedGroups.value[group] : true
}

onMounted(() => {
  loadMenuItems()
})

watch(() => route.path, () => {
  if (route.path.startsWith('/admin/') && route.path !== '/admin/login') {
    loadMenuItems()
  }
})
</script>

<template>
  <div class="admin-layout" :class="{ collapsed: sidebarCollapsed }">
    <aside class="admin-sidebar">
      <div class="admin-sidebar-brand">
        <span class="admin-brand-icon">
          <component :is="getIconComponent('monitor')" class="icon-el" />
        </span>
        <span class="admin-brand-text">
          可视化管理系统
          <small>合江汉代画像石棺项目</small>
        </span>
      </div>
      <div class="admin-sidebar-home">
        <ElTooltip content="首页概览" placement="right" :disabled="!sidebarCollapsed">
          <a 
             class="admin-menu-home"
             :class="{ 'is-active': activeMenu === '/admin/dashboard' }"
             @click.prevent="navigate('/admin/dashboard')"
           >
              <span class="admin-menu-home-ico">
                <component :is="getIconComponent('home-filled')" class="icon-el" />
              </span>
             <span class="admin-menu-home-text" :style="{ display: sidebarCollapsed ? 'none' : '' }">首页概览</span>
           </a>
        </ElTooltip>
      </div>
      <nav class="admin-nav-scroll" aria-label="侧栏多级菜单">
        <ul class="admin-menu-tree" role="tree" v-if="!sidebarCollapsed">
          <li v-for="group in menuStore.menuItems" :key="group.group" class="admin-menu-group" role="none">
            <button 
              class="admin-menu-l1-toggle"
              :class="{ 'is-open': isGroupExpanded(group.group) }"
              @click="toggleGroup(group.group)"
              type="button"
            >
              <span class="admin-menu-l1-text">
                <span v-if="group.icon" class="admin-menu-l1-icon-inline">
                  <component :is="getIconComponent(group.icon)" class="icon-el" />
                </span>
                {{ group.group }}
              </span>
              <span class="admin-menu-chevron"></span>
            </button>
            <div 
              class="admin-menu-l1-panel"
              :class="{ 'is-open': isGroupExpanded(group.group) }"
            >
              <ul class="admin-menu-l2" role="group">
                <li v-for="item in group.items" :key="item.path" role="none">
                  <a 
                    class="admin-menu-link depth-2"
                    :class="{ 'is-active': isItemActive(item.path) }"
                    @click.prevent="navigate(item.path)"
                    role="treeitem"
                  >
                    <span class="admin-menu-item-icon">
                      <component v-if="item.icon" :is="getIconComponent(item.icon)" class="icon-el" />
                    </span>
                    <span class="admin-menu-item-label">{{ item.label }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
        
        <ul class="admin-menu-tree-collapsed" v-else role="tree">
          <li v-for="group in menuStore.menuItems" :key="group.group" class="admin-menu-group-collapsed" role="none">
            <ul class="admin-menu-l2-collapsed" role="group">
              <li v-for="item in group.items" :key="item.path" role="none">
                <ElTooltip :content="item.label" placement="right">
                  <a 
                    class="admin-menu-link-collapsed"
                    :class="{ 'is-active': isItemActive(item.path) }"
                    @click.prevent="navigate(item.path)"
                    role="treeitem"
                  >
                    <span class="admin-menu-item-icon-collapsed">
                      <component v-if="item.icon" :is="getIconComponent(item.icon)" class="icon-el" />
                    </span>
                  </a>
                </ElTooltip>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="admin-wrap">
      <header class="admin-topbar">
        <ElTooltip :content="sidebarCollapsed ? '展开侧边栏' : '收缩侧边栏'" placement="bottom">
          <button class="topbar-toggle" @click="toggleSidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </ElTooltip>
        <div class="topbar-spacer"></div>
        <div class="topbar-user">
          <span class="user-name">{{ userStore.displayName() }}</span>
          <a href="javascript:void(0)" @click.prevent="navigate('/admin/profile')">个人信息</a>
          <a href="javascript:void(0)" @click.prevent="handleLogout">退出</a>
        </div>
      </header>

      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100dvh;
  background: var(--admin-main-bg) !important;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  font-size: 15px;
  
  &, & * {
    box-sizing: border-box;
  }
}

.admin-sidebar {
  width: 248px;
  flex-shrink: 0;
  background: var(--admin-sidebar-bg) !important;
  color: var(--admin-sidebar-text) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100dvh;
  transition: width 0.2s ease;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-layout.collapsed .admin-sidebar {
  width: 64px;
}

.admin-sidebar-home {
  padding: 10px 12px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-menu-home {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  touch-action: manipulation;
  cursor: pointer;
}

.admin-menu-home:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.12);
}

.admin-menu-home.is-active {
  background: rgba(59, 130, 246, 0.18);
  border-color: rgba(59, 130, 246, 0.45);
  color: #fff;
}

.admin-menu-home-ico {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.95) 0%, rgba(29, 78, 216, 0.95) 100%);
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.admin-menu-home.is-active .admin-menu-home-ico {
  background: linear-gradient(180deg, rgba(96, 165, 250, 1) 0%, rgba(37, 99, 235, 1) 100%);
}

.admin-menu-home-text {
  font-size: 0.9rem;
}

.admin-layout.collapsed .admin-sidebar {
  width: 64px;
}

.admin-sidebar-brand {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.35;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;

  small {
    display: block;
    font-weight: 400;
    font-size: 0.72rem;
    color: #94a3b8;
    margin-top: 4px;
  }
}

.admin-brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
  color: #fff;
  flex-shrink: 0;

  .icon-el {
    width: 20px;
    height: 20px;
    font-size: 20px;
  }
}

.admin-brand-text {
  flex: 1;
}

.admin-layout.collapsed .admin-sidebar-brand {
  justify-content: center;
  padding: 12px;
}

.admin-layout.collapsed .admin-brand-text {
  display: none;
}

.admin-nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 20px;
  -webkit-overflow-scrolling: touch;
}

.admin-menu-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-menu-group {
  list-style: none;
  margin: 0;
  padding: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.admin-menu-l1-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px 0 16px;
  border: none;
  background: transparent;
  color: #e2e8f0;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-align: left;
  touch-action: manipulation;
  transition: all 0.15s ease;

  &:hover {
    background: var(--admin-sidebar-hover);
    color: #fff;
  }
}

.admin-layout.collapsed .admin-menu-l1-toggle {
  justify-content: center;
  padding: 0 12px;
}

.admin-menu-l1-text {
  flex: 1;
}

.admin-menu-chevron {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #64748b;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.admin-menu-l1-toggle.is-open .admin-menu-chevron {
  transform: rotate(180deg);
}

.admin-menu-l1-panel {
  display: none;
  padding-bottom: 6px;
}

.admin-menu-l1-panel.is-open {
  display: block;
}

.admin-menu-l2 {
  list-style: none;
  margin: 0;
  padding: 0 0 0 8px;
}

.admin-menu-link {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 12px 0 14px;
  margin: 2px 8px 2px 0;
  border-radius: 0 8px 8px 0;
  color: var(--admin-sidebar-text);
  text-decoration: none;
  font-size: 0.88rem;
  border-left: 3px solid transparent;
  touch-action: manipulation;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--admin-sidebar-hover);
    color: #fff;
  }

  &.is-active {
    background: rgba(59, 130, 246, 0.2);
    color: #fff;
    border-left-color: var(--admin-sidebar-active);
    font-weight: 500;
  }
}

.admin-layout.collapsed .admin-menu-link {
  justify-content: center;
  padding: 0;
  margin: 4px 8px;
  border-radius: 8px;
  border-left: none;
}

.admin-menu-l1-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-menu-l1-icon-inline {
  margin-right: 8px;
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.admin-menu-item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.admin-layout.collapsed .admin-menu-item-icon {
  margin-right: 0;
}

.admin-menu-item-label {
  flex: 1;
  font-size: 0.88rem;
  letter-spacing: 0.02em;
}

.icon-el {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.admin-menu-link:deep(.icon-el) {
  color: currentColor;
}

.nav-icon {
  font-size: 0.95rem;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

.nav-label {
  flex: 1;
  font-size: 0.88rem;
  letter-spacing: 0.02em;
}

.admin-menu-tree-collapsed {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.admin-menu-group-collapsed {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-menu-l2-collapsed {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-menu-link-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  margin: 2px 8px;
  border-radius: 8px;
  color: var(--admin-sidebar-text);
  text-decoration: none;
  touch-action: manipulation;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--admin-sidebar-hover);
    color: #fff;
  }

  &.is-active {
    background: rgba(59, 130, 246, 0.2);
    color: #fff;
  }
}

.admin-menu-item-icon-collapsed {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-el {
    width: 18px;
    height: 18px;
    font-size: 18px;
  }
}

.admin-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
  height: var(--admin-topbar-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 20px;
  background: var(--admin-card-bg);
  border-bottom: 1px solid var(--admin-border);
}

.topbar-toggle {
  margin-right: auto;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--admin-muted);
  display: flex;
  padding: 8px 12px;
  font-family: inherit;
  transition: all 0.2s ease;

  &:hover {
    color: var(--admin-primary);
    border-color: var(--admin-primary);
    background: rgba(var(--admin-primary-rgb), 0.08);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.topbar-spacer {
  flex: 1;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 0.88rem;
  color: var(--admin-muted);
}

.topbar-user a {
  color: var(--admin-primary);
  text-decoration: none;
  font-size: 0.88rem;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
}

.logout-link {
  color: #dc2626 !important;
}

.admin-main {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.admin-page-title {
  margin: 0 0 20px;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--admin-text);
}
</style>
