<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { defaultProfile } from '@/data/admin-store'
import type { Profile } from '@/data/admin-store'
import { ElMessage, ElLoading } from 'element-plus'
import { getUserInfo, updatePassword } from '@/api/auth'
import { updateUser } from '@/api/system'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const profile = ref<Profile>({ ...defaultProfile })
const currentUserId = ref<string>('')

const activeTab = ref('basic')
const showPassword = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function loadUserInfo() {
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const userInfo = await getUserInfo()
    currentUserId.value = userInfo.id.toString()
    
    // 格式化日期为 YYYY-MM-DD HH:MM
    const formatDate = (date: any) => {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
    
    profile.value = {
      account: userInfo.account,
      displayName: userInfo.name,
      phone: userInfo.phone || '',
      email: userInfo.email || '',
      dept: userInfo.dept?.name || '',
      roles: (userInfo.roles || []).map((r: any) => r.name).join('、'),
      createdAt: formatDate(userInfo.createdAt),
    }
    loading.close()
  } catch (error) {
    ElMessage.error('加载用户信息失败')
  }
}

async function saveProfile() {
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '保存中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    await updateUser(currentUserId.value, {
      realName: profile.value.displayName,
      phone: profile.value.phone,
      email: profile.value.email,
    })
    loading.close()
    ElMessage.success('个人信息已保存')
    // 保存成功后重新加载用户信息，确保数据正确显示
    await loadUserInfo()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.error('密码长度不能少于6位')
    return
  }
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '修改中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    })
    loading.close()
    ElMessage.success('密码修改成功')
    showPassword.value = false
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    ElMessage.error('密码修改失败')
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="profile-page">
    <AdminPageHeader title="个人信息" :crumbs="['首页', '系统配置', '个人信息']" />
    <div class="profile-layout">
      <section class="profile-card profile-side">
        <div class="profile-avatar-section">
          <div class="profile-avatar">
            <div class="profile-avatar-mark">{{ profile.displayName.charAt(0) }}</div>
          </div>
          <h2 class="profile-side-title">个人信息</h2>
        </div>
        
        <dl class="profile-info-list">
          <div class="info-item">
            <dt class="info-label">登录账号</dt>
            <dd class="info-value">{{ profile.account }}</dd>
          </div>
          <div class="info-item">
            <dt class="info-label">用户昵称</dt>
            <dd class="info-value">{{ profile.displayName }}</dd>
          </div>
          <div class="info-item">
            <dt class="info-label">手机号码</dt>
            <dd class="info-value">{{ profile.phone || '--' }}</dd>
          </div>
          <div class="info-item">
            <dt class="info-label">用户邮箱</dt>
            <dd class="info-value">{{ profile.email || '--' }}</dd>
          </div>
          <div class="info-item">
            <dt class="info-label">所属部门</dt>
            <dd class="info-value">{{ profile.dept }}</dd>
          </div>
          <div class="info-item">
            <dt class="info-label">所属角色</dt>
            <dd class="info-value">{{ profile.roles }}</dd>
          </div>
          <div class="info-item">
            <dt class="info-label">创建时间</dt>
            <dd class="info-value">{{ profile.createdAt }}</dd>
          </div>
        </dl>
      </section>

      <section class="profile-form-card profile-main">
        <h2>基本资料</h2>
        <div class="form-tabs">
          <button 
            class="tab-item" 
            :class="{ active: activeTab === 'basic' }"
            @click="activeTab = 'basic'"
          >
            基本资料
          </button>
          <button 
            class="tab-item" 
            :class="{ active: activeTab === 'password' }"
            @click="activeTab = 'password'"
          >
            修改密码
          </button>
        </div>

        <section v-if="activeTab === 'basic'" class="form-content">
          <div class="admin-form-row">
            <label for="pf-display">用户昵称</label>
            <input class="admin-input" type="text" id="pf-display" v-model="profile.displayName" placeholder="请输入用户昵称" />
          </div>
          <div class="admin-form-row">
            <label for="pf-phone">手机号码</label>
            <input class="admin-input" type="tel" id="pf-phone" v-model="profile.phone" placeholder="请输入手机号码" />
          </div>
          <div class="admin-form-row">
            <label for="pf-email">邮箱</label>
            <input class="admin-input" type="email" id="pf-email" v-model="profile.email" placeholder="请输入邮箱" />
          </div>
          <div class="profile-actions">
            <button type="button" class="btn btn-primary" @click="saveProfile">保存</button>
            <button type="button" class="btn btn-ghost" @click="activeTab = 'password'">关闭</button>
          </div>
        </section>

        <section v-else class="form-content">
          <div class="admin-form-row">
            <label for="pf-pwd-cur">当前密码</label>
            <input class="admin-input" type="password" id="pf-pwd-cur" v-model="passwordForm.oldPassword" autocomplete="current-password" />
          </div>
          <div class="admin-form-row">
            <label for="pf-pwd-new">新密码</label>
            <input class="admin-input" type="password" id="pf-pwd-new" v-model="passwordForm.newPassword" autocomplete="new-password" />
          </div>
          <div class="admin-form-row">
            <label for="pf-pwd-new2">确认新密码</label>
            <input class="admin-input" type="password" id="pf-pwd-new2" v-model="passwordForm.confirmPassword" autocomplete="new-password" />
          </div>
          <div class="profile-actions">
            <button type="button" class="btn btn-primary" @click="changePassword">修改密码</button>
            <button type="button" class="btn btn-ghost" @click="activeTab = 'basic'">关闭</button>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
:root {
  --admin-border: #e2e8f0;
  --admin-text: #1e293b;
  --admin-muted: #64748b;
  --admin-primary: #2563eb;
  --admin-card-bg: #fff;
  --admin-radius: 10px;
}

.profile-page {
  padding: 0;
}

.profile-header {
  display: none;
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(360px, 420px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 980px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
}

.profile-left {
  width: 100%;
}

.profile-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 18px;
}

.profile-avatar-section {
  text-align: center;
}

.profile-avatar {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffedd5 0%, #fb923c 38%, #ea580c 100%);
  display: grid;
  place-items: center;
  margin: 6px auto 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.12);
}

.profile-avatar-mark {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-weight: 900;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  letter-spacing: 0.08em;
}

.profile-side-title {
  margin: 0 0 12px;
  text-align: center;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--admin-text);
}

.profile-info-list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.info-item {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: #fff;
}

.info-label {
  margin: 0;
  color: var(--admin-muted);
  font-size: 0.82rem;
}

.info-value {
  margin: 0;
  color: var(--admin-text);
  font-size: 0.9rem;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.profile-right {
  width: 100%;
}

.profile-form-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 18px 20px;
}

.profile-form-card h2 {
  margin: 0 0 12px;
  font-size: 1.05rem;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  color: var(--admin-text);
}

.form-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--admin-border);
  padding-bottom: 10px;
}

.tab-item {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  background: transparent;
  color: var(--admin-muted);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    color: var(--admin-primary);
  }
  
  &.active {
    color: var(--admin-primary);
    font-weight: 600;
    background: #eff6ff;
  }
}

.form-content {
  max-width: 760px;
}

.admin-form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;
  align-items: center;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .admin-form-row {
    grid-template-columns: 1fr;
  }
}

.admin-form-row label {
  color: var(--admin-muted);
  font-size: 0.88rem;
}

.admin-input {
  width: 100%;
  max-width: 480px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
}

.profile-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  margin-top: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: #fff;
  color: var(--admin-text);
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
}

.btn-primary {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  color: #fff;
}

.btn-ghost {
  background: transparent;
}
</style>