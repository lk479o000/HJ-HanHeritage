<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getServerInfo } from '@/api/system'
import type { ServerInfo } from '@/api/system'

const loading = ref(false)
const autoRefresh = ref(false)
const info = ref<ServerInfo | null>(null)
const refreshedAt = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

function formatBytes(bytes?: number) {
  const value = bytes || 0
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)}G`
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(2)}M`
  if (value >= 1024) return `${(value / 1024).toFixed(2)}K`
  return `${value}B`
}

function formatUptime(ms?: number) {
  let seconds = Math.floor((ms || 0) / 1000)
  const days = Math.floor(seconds / 86400)
  seconds %= 86400
  const hours = Math.floor(seconds / 3600)
  seconds %= 3600
  const minutes = Math.floor(seconds / 60)
  const parts: string[] = []
  if (days) parts.push(`${days}天`)
  if (hours) parts.push(`${hours}小时`)
  parts.push(`${minutes}分钟`)
  return parts.join('')
}

function formatTime(value?: string | number) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const systemMemory = computed(() => {
  const total = info.value?.totalMemory || 0
  const used = info.value?.usedMemory || 0
  const free = info.value?.freeMemory || 0
  return {
    total: formatBytes(total),
    used: formatBytes(used),
    free: formatBytes(free),
    pct: total > 0 ? ((used / total) * 100).toFixed(2) + '%' : '—',
  }
})

const runtimeMemory = computed(() => {
  const heapTotal = info.value?.processMemory?.heapTotal || 0
  const heapUsed = info.value?.processMemory?.heapUsed || 0
  return {
    total: formatBytes(heapTotal),
    used: formatBytes(heapUsed),
    free: formatBytes(Math.max(heapTotal - heapUsed, 0)),
    pct: heapTotal > 0 ? ((heapUsed / heapTotal) * 100).toFixed(2) + '%' : '—',
  }
})

const disks = computed(() => info.value?.disks || [])
const nodes = computed(() => info.value?.nodes || [])

async function refresh(silent = false) {
  loading.value = true
  try {
    info.value = await getServerInfo()
    refreshedAt.value = new Date()
    if (!silent) ElMessage.success('已刷新')
  } catch (error: any) {
    if (!silent) ElMessage.error(error?.message || '监控数据加载失败')
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh(value: boolean) {
  if (timer) clearInterval(timer)
  timer = null
  if (value) timer = setInterval(() => refresh(true), 5000)
}

onMounted(() => refresh(true))
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="monitor-page" v-loading="loading">
    <AdminPageHeader title="服务监控" :crumbs="['首页', '运维监控', '服务监控']" />
    <p class="mon-page-desc">监控宿主机 CPU、内存、服务器信息、运行时与磁盘状态。数据来自 API 所在主机实时采集。</p>

    <div class="mon-toolbar-row">
      <button type="button" class="btn btn-primary" @click="refresh(false)">刷新</button>
      <el-checkbox v-model="autoRefresh" @change="toggleAutoRefresh">每 5 秒自动刷新</el-checkbox>
      <span class="mon-refresh-meta">上次刷新：{{ formatTime(refreshedAt?.getTime()) }}</span>
    </div>

    <section class="mon-dash-card">
      <h2 class="mon-dash-card-title">CPU</h2>
      <div class="mon-dash-card-body">
        <table class="mon-attr-table">
          <tbody>
            <tr><th>核心数</th><td>{{ info?.cpuCount ?? '—' }}</td></tr>
            <tr><th>用户使用率</th><td>{{ info ? info.cpuUserPct.toFixed(2) + '%' : '—' }}</td></tr>
            <tr><th>系统使用率</th><td>{{ info ? info.cpuSysPct.toFixed(2) + '%' : '—' }}</td></tr>
            <tr><th>当前空闲率</th><td>{{ info ? info.cpuIdlePct.toFixed(2) + '%' : '—' }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mon-dash-card">
      <h2 class="mon-dash-card-title">内存</h2>
      <div class="mon-dash-card-body">
        <table class="mon-attr-table mon-attr-table--triple">
          <thead>
            <tr><th>属性</th><th>内存</th><th>运行时</th></tr>
          </thead>
          <tbody>
            <tr><th>总内存</th><td class="num">{{ systemMemory.total }}</td><td class="num">{{ runtimeMemory.total }}</td></tr>
            <tr><th>已用内存</th><td class="num">{{ systemMemory.used }}</td><td class="num">{{ runtimeMemory.used }}</td></tr>
            <tr><th>剩余内存</th><td class="num">{{ systemMemory.free }}</td><td class="num">{{ runtimeMemory.free }}</td></tr>
            <tr><th>使用率</th><td class="num">{{ systemMemory.pct }}</td><td class="num">{{ runtimeMemory.pct }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mon-dash-card">
      <h2 class="mon-dash-card-title">服务器信息</h2>
      <div class="mon-dash-card-body mon-kv-grid">
        <div class="mon-kv-cell"><span class="mon-kv-label">服务器名称</span><span class="mon-kv-val">{{ info?.hostname || '—' }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">操作系统</span><span class="mon-kv-val">{{ info ? `${info.osType} ${info.osRelease}` : '—' }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">服务器 IP</span><span class="mon-kv-val">{{ info?.ip || '—' }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">系统架构</span><span class="mon-kv-val">{{ info?.arch || '—' }}</span></div>
      </div>
    </section>

    <section class="mon-dash-card">
      <h2 class="mon-dash-card-title">运行时信息</h2>
      <div class="mon-dash-card-body mon-kv-grid">
        <div class="mon-kv-cell"><span class="mon-kv-label">运行环境</span><span class="mon-kv-val">{{ info?.runtime?.name || '—' }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">版本</span><span class="mon-kv-val">{{ info?.runtime?.version || '—' }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">启动时间</span><span class="mon-kv-val">{{ formatTime(info?.runtime?.startTime) }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">运行时长</span><span class="mon-kv-val">{{ formatUptime(info?.runtime?.uptime) }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">安装路径</span><span class="mon-kv-val">{{ info?.runtime?.home || '—' }}</span></div>
        <div class="mon-kv-cell"><span class="mon-kv-label">项目路径</span><span class="mon-kv-val">{{ info?.runtime?.projectPath || '—' }}</span></div>
        <div class="mon-kv-cell mon-kv-cell--full"><span class="mon-kv-label">运行参数</span><span class="mon-kv-val">{{ info?.runtime?.args?.join(' ') || '—' }}</span></div>
      </div>
    </section>

    <section class="mon-dash-card">
      <h2 class="mon-dash-card-title">磁盘状态</h2>
      <div class="mon-dash-card-body mon-data-table-wrap">
        <table class="mon-data-table">
          <thead>
            <tr><th>盘符</th><th>总容量</th><th>已用</th><th>可用</th><th>使用率</th></tr>
          </thead>
          <tbody>
            <tr v-for="disk in disks" :key="disk.mount">
              <td>{{ disk.mount }}</td>
              <td class="num">{{ formatBytes(disk.total) }}</td>
              <td class="num">{{ formatBytes(disk.used) }}</td>
              <td class="num">{{ formatBytes(disk.free) }}</td>
              <td class="num">{{ disk.usagePct.toFixed(2) }}%</td>
            </tr>
            <tr v-if="!disks.length"><td colspan="5" class="mon-empty">暂无磁盘数据</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mon-dash-card">
      <h2 class="mon-dash-card-title">虚拟机与节点</h2>
      <div class="mon-dash-card-body mon-data-table-wrap">
        <table class="mon-data-table">
          <thead>
            <tr><th>名称</th><th>类型</th><th>状态</th><th>CPU</th><th>内存</th></tr>
          </thead>
          <tbody>
            <tr v-for="node in nodes" :key="node.name">
              <td>{{ node.name }}</td>
              <td>{{ node.type }}</td>
              <td><span class="mon-status-ok">{{ node.status }}</span></td>
              <td class="num">{{ node.cpuPct.toFixed(1) }}%</td>
              <td class="num">{{ formatBytes(node.memUsed) }} / {{ formatBytes(node.memTotal) }}</td>
            </tr>
            <tr v-if="!nodes.length"><td colspan="5" class="mon-empty">暂无节点数据</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.monitor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mon-page-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--admin-muted);
}

.mon-toolbar-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mon-refresh-meta {
  font-size: 0.76rem;
  color: var(--admin-muted);
}

.mon-dash-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.mon-dash-card-title {
  margin: 0;
  padding: 12px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--admin-text);
  border-bottom: 1px solid var(--admin-border);
  background: linear-gradient(180deg, rgba(90, 155, 138, 0.06) 0%, transparent 100%);
  font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
  letter-spacing: 0.04em;
}

.mon-dash-card-body {
  padding: 14px 18px;
}

.mon-attr-table,
.mon-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;

  th, td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(90, 155, 138, 0.15);
    text-align: left;
  }

  th {
    color: var(--admin-muted);
    font-weight: 500;
    width: 160px;
    background: rgba(90, 155, 138, 0.04);
  }

  td {
    color: var(--admin-text);
  }

  .num { text-align: right; font-variant-numeric: tabular-nums; }
}

.mon-attr-table--triple thead th {
  background: rgba(90, 155, 138, 0.08);
  color: var(--admin-text);
}

.mon-data-table thead th {
  width: auto;
  background: rgba(90, 155, 138, 0.08);
  color: var(--admin-text);
}

.mon-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 24px;
}

.mon-kv-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.82rem;
  min-width: 0;
}

.mon-kv-cell--full {
  grid-column: 1 / -1;
}

.mon-kv-label {
  width: 92px;
  flex-shrink: 0;
  color: var(--admin-muted);
}

.mon-kv-val {
  color: var(--admin-text);
  word-break: break-all;
}

.mon-status-ok {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  font-size: 0.72rem;
}

.mon-empty {
  text-align: center;
  color: var(--admin-muted);
}

@media (max-width: 900px) {
  .mon-kv-grid { grid-template-columns: 1fr; }
}
</style>
