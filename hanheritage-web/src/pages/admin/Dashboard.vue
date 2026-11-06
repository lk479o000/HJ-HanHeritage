<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getDashboardSummary } from '@/api/system'
import type { DashboardSummary } from '@/api/system'
import { fmtShortDate } from '@/data/admin-store'

function scopeText(scope: string) {
  if (scope === 'dept') return '部门可见'
  if (scope === 'role') return '角色可见'
  return '全体可见'
}

const loading = ref(false)
const summary = ref<DashboardSummary | null>(null)

const RESOURCE_TONES: Record<string, string> = {
  panorama: 'blue',
  model: 'jade',
  image: 'amber',
  pointcloud: 'violet',
  video: 'red',
  doc: 'slate',
  document: 'slate',
  folder: 'slate',
}
const RESOURCE_LABELS: Record<string, string> = {
  panorama: '全景',
  model: '模型',
  image: '图片',
  pointcloud: '点云',
  video: '视频',
  doc: '文档',
  document: '文档',
  folder: '目录',
}

const counts = computed(() => summary.value?.counts)

const statCards = computed(() => {
  const c = counts.value
  return [
    { key: '崖墓群', value: c?.cliffs ?? 0, unit: '处', tone: 'blue' },
    { key: '石棺', value: c?.coffins ?? 0, unit: '具', tone: 'jade' },
    { key: '公告（已发布）', value: c?.publishedNotices ?? 0, unit: '条', tone: 'amber' },
    { key: '用户', value: c?.users ?? 0, unit: '人', tone: 'slate' },
    { key: '在线用户', value: c?.onlineUsers ?? 0, unit: '人', tone: 'green' },
    { key: '操作日志', value: c?.operationLogs ?? 0, unit: '条', tone: 'slate' },
    { key: '登录日志', value: c?.loginLogs ?? 0, unit: '条', tone: 'slate' },
  ]
})

const resourceStats = computed(() => {
  const list = summary.value?.resourceStats || []
  const total = list.reduce((sum, item) => sum + item.count, 0)
  const max = Math.max(...list.map(item => item.count), 1)
  return {
    total,
    items: list.map(item => ({
      label: RESOURCE_LABELS[item.type] || item.type,
      value: item.count,
      tone: RESOURCE_TONES[item.type] || 'slate',
      width: Math.round((item.count / max) * 100),
    })),
  }
})

const loginSpark = computed(() => {
  const trend = summary.value?.loginTrend || []
  const values = trend.map(item => item.count)
  const total = values.reduce((sum, value) => sum + value, 0)
  const width = 220
  const height = 56
  const padX = 8
  const padY = 8
  if (!values.length) return { line: '', fill: '', total, points: [] as Array<{ x: number; y: number; date: string; count: number }> }
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const step = values.length > 1 ? innerW / (values.length - 1) : 0
  const points = values.map((value, index) => ({
    x: padX + index * step,
    y: padY + (1 - (value - min) / (max - min || 1)) * innerH,
    date: trend[index]?.date || '',
    count: value,
  }))
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const fill = `${line} L ${(padX + innerW).toFixed(1)} ${(padY + innerH).toFixed(1)} L ${padX.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`
  return { line, fill, total, points }
})

const notices = computed(() => summary.value?.notices || [])
const recentOps = computed(() => summary.value?.recentOperations || [])
const onlineList = computed(() => summary.value?.onlineUserList || [])

async function loadSummary() {
  loading.value = true
  try {
    summary.value = await getDashboardSummary()
  } catch (error: any) {
    ElMessage.error(error?.message || '首页数据加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadSummary)
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <AdminPageHeader title="首页概览" :crumbs="['首页']" />

    <div class="dash-top-links">
      <router-link to="/" class="dash-link-card">
        <div class="dash-link-icon">3D</div>
        <div class="dash-link-body">
          <div class="dash-link-title">三维互动系统</div>
          <div class="dash-link-desc">游客端交互展示入口（平移 / 旋转 / 缩放 / 全景漫游等）</div>
        </div>
        <div class="dash-link-go">打开</div>
      </router-link>
      <router-link to="/panorama" class="dash-link-card dash-link-card--alt">
        <div class="dash-link-icon">馆</div>
        <div class="dash-link-body">
          <div class="dash-link-title">博物馆展示系统</div>
          <div class="dash-link-desc">博物馆全景与石棺展示入口</div>
        </div>
        <div class="dash-link-go">打开</div>
      </router-link>
    </div>

    <div class="admin-card dash-quick-card">
      <h2>快捷入口</h2>
      <div class="admin-toolbar dash-quick">
        <router-link to="/admin/cliff" class="btn btn-primary">崖墓管理</router-link>
        <router-link to="/admin/coffin" class="btn btn-primary">石棺管理</router-link>
        <router-link to="/admin/panorama" class="btn btn-primary">博物馆全景管理</router-link>
        <router-link to="/admin/resource" class="btn btn-primary">资源管理</router-link>
      </div>
    </div>

    <div class="dash-grid">
      <section class="dash-panel dash-panel--notice admin-card">
        <div class="dash-panel-head">
          <h2>公告栏</h2>
          <router-link to="/admin/notice" class="btn btn-ghost">全部公告</router-link>
        </div>
        <ul v-if="notices.length" class="dash-notice-list">
          <li v-for="notice in notices" :key="notice.id">
            <div class="dash-nt-head">
              <div class="dash-nt-title">{{ notice.title }}</div>
              <div class="dash-nt-meta">{{ fmtShortDate(new Date(notice.publishedAt).getTime()) }} · {{ scopeText(notice.scope) }}</div>
            </div>
            <div class="dash-nt-body">{{ notice.content }}</div>
          </li>
        </ul>
        <div v-else class="dash-empty">暂无已发布公告</div>
      </section>

      <section class="dash-panel dash-panel--stats admin-card">
        <div class="dash-panel-head">
          <h2>数据统计</h2>
          <span class="admin-muted">{{ summary?.collectedAt ? `更新于 ${fmtShortDate(new Date(summary.collectedAt).getTime())}` : '' }}</span>
        </div>
        <div class="dash-stats">
          <div v-for="card in statCards" :key="card.key" class="dash-stat" :class="`dash-stat--${card.tone}`">
            <div class="dash-stat-k">{{ card.key }}</div>
            <div class="dash-stat-v">{{ card.value }}<span class="dash-stat-u">{{ card.unit }}</span></div>
          </div>
        </div>

        <div class="dash-charts">
          <div class="dash-chart-card">
            <div class="dash-chart-head">
              <div class="dash-chart-title">资源类型分布</div>
              <div class="dash-chart-sub">总计 {{ resourceStats.total }} 项</div>
            </div>
            <div v-if="resourceStats.items.length" class="dash-mini-bars">
              <div v-for="item in resourceStats.items" :key="item.label" class="dash-mini-bar">
                <div class="dash-mini-bar-k">{{ item.label }}</div>
                <div class="dash-mini-bar-track">
                  <div class="dash-mini-bar-fill" :class="`dash-mini-bar--${item.tone}`" :style="{ width: item.width + '%' }"></div>
                </div>
                <div class="dash-mini-bar-v">{{ item.value }}</div>
              </div>
            </div>
            <div v-else class="dash-empty">暂无资源数据</div>
          </div>

          <div class="dash-chart-card">
            <div class="dash-chart-head">
              <div class="dash-chart-title">近 7 天登录概览</div>
              <div class="dash-chart-sub">合计 {{ loginSpark.total }} 次</div>
            </div>
            <svg v-if="loginSpark.line" class="dash-spark" viewBox="0 0 220 56" aria-label="近7天登录趋势">
              <path :d="loginSpark.fill" fill="rgba(37, 99, 235, 0.12)" />
              <path :d="loginSpark.line" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" />
            </svg>
            <div v-if="loginSpark.points.length" class="dash-spark-axis">
              <span v-for="point in loginSpark.points" :key="point.date" :title="`${point.date}：${point.count} 次`">{{ point.date.slice(5) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="dash-panel dash-panel--logs admin-card">
        <div class="dash-panel-head">
          <h2>日志与在线</h2>
          <div class="dash-panel-actions">
            <router-link to="/admin/log-login" class="btn btn-ghost">登录日志</router-link>
            <router-link to="/admin/log-operation" class="btn btn-ghost">操作日志</router-link>
          </div>
        </div>
        <div class="dash-two-cols">
          <div>
            <div class="dash-subtitle">最新操作</div>
            <ul v-if="recentOps.length" class="dash-list">
              <li v-for="op in recentOps" :key="op.id">
                <div class="dash-li-row">
                  <div class="dash-li-title">{{ op.module }}</div>
                  <span class="dash-badge dash-badge--slate">{{ op.action }}</span>
                </div>
                <div class="dash-li-meta">{{ op.userDisplay }} · {{ fmtShortDate(op.at) }}</div>
              </li>
            </ul>
            <div v-else class="dash-empty">暂无操作记录</div>
          </div>
          <div>
            <div class="dash-subtitle">在线用户</div>
            <ul v-if="onlineList.length" class="dash-list">
              <li v-for="user in onlineList" :key="user.id">
                <div class="dash-li-row">
                  <div class="dash-li-title">{{ user.name }}</div>
                  <span class="dash-badge dash-badge--green">在线</span>
                </div>
                <div class="dash-li-meta">{{ user.dept || '—' }} · {{ fmtShortDate(user.loginAt) }}</div>
              </li>
            </ul>
            <div v-else class="dash-empty">暂无在线会话</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dash-top-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dash-link-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(90, 155, 138, 0.35);
  background: linear-gradient(120deg, #1f4d46 0%, #2f6f64 100%);
  color: #f7f2e8;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(31, 77, 70, 0.18);
}

.dash-link-card--alt {
  background: linear-gradient(120deg, #5b4630 0%, #8a6a45 100%);
}

.dash-link-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.dash-link-body {
  flex: 1;
  min-width: 0;
}

.dash-link-title {
  font-size: 0.98rem;
  font-weight: 600;
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
}

.dash-link-desc {
  margin-top: 4px;
  font-size: 0.76rem;
  opacity: 0.82;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-link-go {
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.dash-quick-card {
  padding: 16px 20px;
  border: 1px solid rgba(90, 155, 138, 0.35);
  border-radius: 12px;
  background: linear-gradient(165deg, #fffef9 0%, #f7f2e8 100%);
}

.dash-quick-card h2 {
  margin: 0 0 10px;
  font-size: 0.92rem;
  color: #1e2d2a;
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
}

.dash-quick {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dash-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.dash-panel {
  padding: 14px 18px 18px;
  border: 1px solid rgba(90, 155, 138, 0.35);
  border-radius: 12px;
  background: linear-gradient(165deg, #fffef9 0%, #f7f2e8 100%);
  box-shadow: 0 2px 8px rgba(80, 120, 110, 0.06);
  min-width: 0;
}

.dash-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(90, 155, 138, 0.22);
  margin-bottom: 12px;
}

.dash-panel-head h2 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: #1e2d2a;
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
  letter-spacing: 0.04em;
}

.dash-panel-actions {
  display: flex;
  gap: 6px;
}

.dash-notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 520px;
  overflow: auto;
}

.dash-notice-list li {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(90, 155, 138, 0.16);
}

.dash-notice-list li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dash-nt-title {
  font-weight: 600;
  color: #2c3330;
  font-size: 0.86rem;
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
}

.dash-nt-meta {
  font-size: 0.74rem;
  color: #5a726e;
  margin-top: 3px;
}

.dash-nt-body {
  margin-top: 6px;
  font-size: 0.76rem;
  color: #4a5f5b;
  line-height: 1.6;
  display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  overflow: hidden;
}

.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.dash-stat {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(90, 155, 138, 0.25);
  background: rgba(255, 255, 255, 0.7);
}

.dash-stat--blue { border-color: rgba(37, 99, 235, 0.35); }
.dash-stat--jade { border-color: rgba(13, 148, 136, 0.35); }
.dash-stat--amber { border-color: rgba(217, 119, 6, 0.35); }
.dash-stat--green { border-color: rgba(22, 163, 74, 0.35); }

.dash-stat-k {
  font-size: 0.72rem;
  color: #5a726e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-stat-v {
  margin-top: 4px;
  font-size: 1.32rem;
  font-weight: 700;
  color: #1e2d2a;
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
}

.dash-stat-u {
  margin-left: 3px;
  font-size: 0.7rem;
  font-weight: 400;
  color: #5a726e;
}

.dash-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}

.dash-chart-card {
  padding: 10px 12px;
  border: 1px solid rgba(90, 155, 138, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
}

.dash-chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.dash-chart-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e2d2a;
}

.dash-chart-sub {
  font-size: 0.72rem;
  color: #5a726e;
}

.dash-mini-bars {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.dash-mini-bar {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 8px;
}

.dash-mini-bar-k {
  font-size: 0.72rem;
  color: #5a726e;
}

.dash-mini-bar-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(90, 155, 138, 0.12);
  overflow: hidden;
}

.dash-mini-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
  background: #2563eb;
}

.dash-mini-bar--jade { background: #0d9488; }
.dash-mini-bar--amber { background: #d97706; }
.dash-mini-bar--violet { background: #7c3aed; }
.dash-mini-bar--red { background: #dc2626; }
.dash-mini-bar--slate { background: #64748b; }

.dash-mini-bar-v {
  font-size: 0.72rem;
  color: #1e2d2a;
  font-weight: 600;
  text-align: right;
}

.dash-spark {
  display: block;
  width: 100%;
  height: 56px;
}

.dash-spark-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.62rem;
  color: #8aa09b;
  gap: 2px;
}

.dash-spark-axis span {
  flex: 1;
  text-align: center;
}

.dash-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.dash-subtitle {
  font-size: 0.76rem;
  font-weight: 600;
  color: #1e2d2a;
  margin-bottom: 8px;
}

.dash-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.dash-list li {
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(90, 155, 138, 0.22);
}

.dash-list li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dash-li-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dash-li-title {
  font-size: 0.78rem;
  color: #2c3330;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-li-meta {
  margin-top: 3px;
  font-size: 0.7rem;
  color: #5a726e;
}

.dash-badge {
  font-size: 0.64rem;
  padding: 1px 6px;
  border-radius: 999px;
  flex-shrink: 0;
}
.dash-badge--slate { background: rgba(100, 116, 139, 0.14); color: #475569; }
.dash-badge--green { background: rgba(22, 163, 74, 0.14); color: #15803d; }

.dash-empty {
  color: #5a726e;
  font-size: 0.8rem;
  text-align: center;
  padding: 18px 0;
}

@media (max-width: 1280px) {
  .dash-grid { grid-template-columns: 1fr 1fr; }
  .dash-panel--logs { grid-column: 1 / -1; }
}
</style>
