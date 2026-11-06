import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const ALWAYS_ALLOWED = ['/admin/dashboard', '/admin/profile']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/visitor/Home.vue'),
    },
    {
      path: '/cliff/:id',
      name: 'cliff-detail',
      component: () => import('@/pages/visitor/CliffDetail.vue'),
      props: true,
    },
    {
      path: '/big-ear-cliff',
      name: 'big-ear-cliff',
      component: () => import('@/pages/visitor/BigEarCliff.vue'),
    },
    {
      path: '/coffin-map',
      name: 'coffin-map',
      component: () => import('@/pages/visitor/CoffinMap.vue'),
    },
    {
      path: '/coffin/:id',
      name: 'coffin',
      component: () => import('@/pages/visitor/Coffin.vue'),
      props: true,
    },
    {
      path: '/panorama',
      name: 'panorama',
      component: () => import('@/pages/visitor/Panorama.vue'),
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/pages/admin/Login.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/pages/admin/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/pages/admin/Dashboard.vue') },
        { path: 'cliff', name: 'admin-cliff', component: () => import('@/pages/admin/Cliff.vue') },
        { path: 'coffin', name: 'admin-coffin', component: () => import('@/pages/admin/Coffin.vue') },
        { path: 'panorama', name: 'admin-panorama', component: () => import('@/pages/admin/Panorama.vue') },
        { path: 'resource', name: 'admin-resource', component: () => import('@/pages/admin/Resource.vue') },
        { path: 'user', name: 'admin-user', component: () => import('@/pages/admin/User.vue') },
        { path: 'role', name: 'admin-role', component: () => import('@/pages/admin/Role.vue') },
        { path: 'dept', name: 'admin-dept', component: () => import('@/pages/admin/Dept.vue') },
        { path: 'post', name: 'admin-post', component: () => import('@/pages/admin/Post.vue') },
        { path: 'log-operation', name: 'admin-log-operation', component: () => import('@/pages/admin/LogOperation.vue') },
        { path: 'log-login', name: 'admin-log-login', component: () => import('@/pages/admin/LogLogin.vue') },
        { path: 'online-users', name: 'admin-online-users', component: () => import('@/pages/admin/OnlineUser.vue') },
        { path: 'online-user', redirect: '/admin/online-users' },
        { path: 'monitor-jvm', name: 'admin-monitor-jvm', component: () => import('@/pages/admin/MonitorJvm.vue') },
        { path: 'monitor-redis', name: 'admin-monitor-redis', component: () => import('@/pages/admin/MonitorRedis.vue') },
        { path: 'server', name: 'admin-server', component: () => import('@/pages/admin/Server.vue') },
        { path: 'menu', name: 'admin-menu', component: () => import('@/pages/admin/Menu.vue') },
        { path: 'notice', name: 'admin-notice', component: () => import('@/pages/admin/Notice.vue') },
        { path: 'profile', name: 'admin-profile', component: () => import('@/pages/admin/Profile.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (!to.path.startsWith('/admin')) {
    return true
  }

  const userStore = useUserStore()
  const isLoginPage = to.path === '/admin/login'

  if (isLoginPage) {
    return userStore.isLoggedIn() ? '/admin/dashboard' : true
  }

  if (!userStore.isLoggedIn()) {
    return {
      path: '/admin/login',
      query: { redirect: to.fullPath },
    }
  }

  if (ALWAYS_ALLOWED.includes(to.path)) {
    return true
  }

  if (userStore.isAdmin()) {
    return true
  }

  const allowedPaths = userStore.getMenuPaths()
  if (allowedPaths.some((p) => to.path === p || to.path.startsWith(p + '/'))) {
    return true
  }

  return '/admin/dashboard'
})

export default router
