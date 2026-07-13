<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { defaultNotices, operationLogs, onlineUsers, fmtShortDate, scopeText } from '@/data/admin-store'
import type { Notice, OperationLog, OnlineUser } from '@/data/admin-store'

const stats = ref([
  { label: '崖墓群', value: 13, icon: '🏔', color: '#2563eb' },
  { label: '石棺', value: 28, icon: '⚰', color: '#7c3aed' },
  { label: '全景场景', value: 42, icon: '🌐', color: '#059669' },
  { label: '资源文件', value: 156, icon: '📁', color: '#d97706' },
])

const notices = ref<Notice[]>([])
const recentOps = ref<OperationLog[]>([])
const online = ref<OnlineUser[]>([])

const barData = [
  { label: '三维模型', value: 38, color: '#2563eb' },
  { label: '平面影像', value: 52, color: '#7c3aed' },
  { label: '数字文档', value: 24, color: '#059669' },
  { label: '扫描数据', value: 18, color: '#d97706' },
  { label: '点云数据', value: 12, color: '#dc2626' },
  { label: '成果数据', value: 8, color: '#64748b' },
  { label: '视频', value: 4, color: '#a855f7' },
]
const barMax = Math.max(...barData.map(d => d.value))

const sparkData = [3, 5, 2, 8, 6, 4, 7, 9, 5, 3, 6, 8]
const sparkMax = Math.max(...sparkData)
const sparkMin = Math.min(...sparkData)
const sparkW = 220
const sparkH = 48
const sparkPoints = sparkData.map((v, i) => {
  const x = (i / (sparkData.length - 1)) * sparkW
  const y = sparkH - ((v - sparkMin) / (sparkMax - sparkMin)) * sparkH
  return `${x},${y}`
}).join(' ')

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  notices.value = defaultNotices.filter(n => n.status === 'published').sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
  recentOps.value = operationLogs.slice(0, 5)
  online.value = onlineUsers.slice(0, 5)
  timer = setInterval(() => {
    stats.value[0].value = 13 + Math.floor(Math.random() * 2)
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="dashboard-page">
    <AdminPageHeader title="首页概览" :crumbs="['首页']" />
    <div class="dash-stats">
      <div v-for="s in stats" :key="s.label" class="stat-card">
        <div class="stat-icon" :style="{ background: s.color + '18', color: s.color }">{{ s.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="dash-row">
      <div class="dash-card dash-notice">
        <div class="dash-card__head">
          <h3>通知公告</h3>
        </div>
        <div class="dash-card__body">
          <ul class="dash-notice-list" v-if="notices.length">
            <li v-for="n in notices" :key="n.id">
              <div class="dn-title">{{ n.title }}</div>
              <div class="dn-meta">{{ fmtShortDate(n.updatedAt) }} · {{ scopeText(n.scope) }}</div>
            </li>
          </ul>
          <div v-else class="dash-empty">暂无公告</div>
        </div>
      </div>

      <div class="dash-card dash-chart">
        <div class="dash-card__head">
          <h3>资源分布</h3>
        </div>
        <div class="dash-card__body">
          <div class="bar-chart">
            <div v-for="d in barData" :key="d.label" class="bar-row">
              <span class="bar-label">{{ d.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: (d.value / barMax * 100) + '%', background: d.color }"></div>
              </div>
              <span class="bar-val">{{ d.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dash-card dash-spark">
        <div class="dash-card__head">
          <h3>近7日登录趋势</h3>
        </div>
        <div class="dash-card__body">
          <svg :width="sparkW" :height="sparkH" class="sparkline">
            <polyline :points="sparkPoints" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>

    <div class="dash-row">
      <div class="dash-card dash-ops">
        <div class="dash-card__head">
          <h3>最近操作</h3>
        </div>
        <div class="dash-card__body">
          <el-table :data="recentOps" size="small" stripe>
            <el-table-column prop="userDisplay" label="操作人" width="100" />
            <el-table-column prop="module" label="模块" width="100" />
            <el-table-column prop="action" label="操作" width="70" />
            <el-table-column prop="detail" label="详情" show-overflow-tooltip />
          </el-table>
        </div>
      </div>

      <div class="dash-card dash-online">
        <div class="dash-card__head">
          <h3>在线用户</h3>
        </div>
        <div class="dash-card__body">
          <el-table :data="online" size="small" stripe>
            <el-table-column prop="name" label="用户" width="90" />
            <el-table-column prop="dept" label="部门" width="90" />
            <el-table-column label="登录时间" width="130">
              <template #default="{ row }">{{ fmtShortDate(row.loginAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: linear-gradient(165deg, #fffef9 0%, #f7f2e8 100%);
  border: 1px solid rgba(90, 155, 138, 0.35);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(80, 120, 110, 0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e2d2a;
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
}

.stat-label {
  font-size: 0.82rem;
  color: #5a726e;
  margin-top: 2px;
}

.dash-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dash-row:first-of-type {
  grid-template-columns: 1fr 1fr 1fr;
}

.dash-card {
  background: linear-gradient(165deg, #fffef9 0%, #f7f2e8 100%);
  border: 1px solid rgba(90, 155, 138, 0.35);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(80, 120, 110, 0.06);
  overflow: hidden;
}

.dash-card__head {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(90, 155, 138, 0.35);
  background: linear-gradient(180deg, rgba(90, 155, 138, 0.05) 0%, transparent 100%);

  h3 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: #1e2d2a;
    font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
    letter-spacing: 0.04em;
  }
}

.dash-card__body {
  padding: 16px 20px;
}

.dash-notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    padding: 10px 0;
    border-bottom: 1px solid rgba(90, 155, 138, 0.15);

    &:last-child { border-bottom: none; }
  }
}

.dn-title { 
  font-weight: 600; 
  color: #2c3330; 
  font-size: 0.88rem; 
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
}
.dn-meta { font-size: 0.78rem; color: #5a726e; margin-top: 4px; }
.dash-empty { color: #5a726e; font-size: 0.88rem; text-align: center; padding: 20px 0; }

.bar-chart { display: flex; flex-direction: column; gap: 10px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-label { width: 70px; font-size: 0.78rem; color: #5a726e; text-align: right; flex-shrink: 0; }
.bar-track { flex: 1; height: 16px; background: rgba(90, 155, 138, 0.1); border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
.bar-val { width: 28px; font-size: 0.78rem; color: #2c3330; font-weight: 600; }

.sparkline { display: block; }
</style>
