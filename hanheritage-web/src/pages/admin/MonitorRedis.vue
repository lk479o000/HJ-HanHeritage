<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getRedisInfo } from '@/api/system'
import type { RedisInfo } from '@/api/system'

const COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#c0c4cc']

const loading = ref(false)
const autoRefresh = ref(false)
const info = ref<RedisInfo | null>(null)
const refreshedAt = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const connected = computed(() => info.value?.status === 'connected')
const commands = computed(() => info.value?.commands || [])

const commandStops = computed(() => {
  let cumulative = 0
  const stops: string[] = []
  commands.value.forEach((item, index) => {
    const start = cumulative
    cumulative += item.pct
    stops.push(`${COLORS[index % COLORS.length]} ${start}% ${cumulative}%`)
  })
  if (cumulative < 100) stops.push(`#ebeef5 ${cumulative}% 100%`)
  return stops.join(', ')
})

const usedMemoryMb = computed(() => (info.value?.usedMemory || 0) / 1024 / 1024)
const gaugeScale = computed(() => {
  const maxMb = (info.value?.maxMemory || 0) / 1024 / 1024
  if (maxMb > 0) return maxMb
  return Math.max(Math.ceil(usedMemoryMb.value / 250) * 250, 250)
})
const gaugePercent = computed(() => Math.min((usedMemoryMb.value / gaugeScale.value) * 100, 100))
const gaugeAngle = computed(() => 90 - (gaugePercent.value / 100) * 180)

function formatTime(value?: string | number) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

async function refresh(silent = false) {
  loading.value = true
  try {
    info.value = await getRedisInfo()
    refreshedAt.value = new Date()
    if (!silent) {
      if (connected.value) ElMessage.success('已刷新')
      else ElMessage.warning(info.value?.message || 'Redis 未连接')
    }
  } catch (error: any) {
    if (!silent) ElMessage.error(error?.message || 'Redis 监控数据加载失败')
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh(value: boolean) {
  if (timer) clearInterval(timer)
  timer = null
  if (value) timer = setInterval(() => refresh(true), 4000)
}

onMounted(() => refresh(true))
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="redis-page" v-loading="loading">
    <AdminPageHeader title="缓存监控" :crumbs="['首页', '运维监控', '缓存监控']" />
    <p class="redis-page-desc">Redis 基本信息、命令分布与内存消耗，数据来自 127.0.0.1:6379 实时 INFO。</p>

    <div class="redis-toolbar">
      <button type="button" class="btn btn-primary" @click="refresh(false)">刷新</button>
      <el-checkbox v-model="autoRefresh" @change="toggleAutoRefresh">每 4 秒自动刷新</el-checkbox>
      <span class="redis-refresh-meta">上次刷新：{{ formatTime(refreshedAt?.getTime()) }}</span>
    </div>

    <div v-if="!connected" class="redis-offline admin-card">
      <h3>Redis 未连接</h3>
      <p>{{ info?.message || '无法获取 Redis 信息' }}</p>
    </div>

    <template v-else>
      <section class="mon-dash-card">
        <h2 class="mon-dash-card-title">基本信息</h2>
        <div class="mon-dash-card-body redis-basic-grid">
          <div class="redis-basic-cell"><span class="redis-basic-label">Redis 版本</span><span class="redis-basic-val">{{ info?.version || '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">运行模式</span><span class="redis-basic-val">{{ info?.mode || '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">端口</span><span class="redis-basic-val">{{ info?.port ?? '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">客户端数</span><span class="redis-basic-val">{{ info?.clients ?? '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">运行时间（天）</span><span class="redis-basic-val">{{ info?.uptimeDays ?? '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">使用内存</span><span class="redis-basic-val">{{ info?.usedMemoryHuman || '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">使用 CPU</span><span class="redis-basic-val">{{ info ? info.cpuPct!.toFixed(2) + '%' : '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">内存配置</span><span class="redis-basic-val">{{ info?.maxMemoryHuman || '0B' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">AOF 是否开启</span><span class="redis-basic-val">{{ info?.aofEnabled ? '是' : '否' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">RDB 是否成功</span><span class="redis-basic-val">{{ info?.rdbLastStatus || '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">Key 数量</span><span class="redis-basic-val">{{ info?.keyCount ?? '—' }}</span></div>
          <div class="redis-basic-cell"><span class="redis-basic-label">网络入口 / 出口</span><span class="redis-basic-val">{{ info?.netInKbps ?? 0 }}kps / {{ info?.netOutKbps ?? 0 }}kps</span></div>
        </div>
      </section>

      <div class="redis-charts-row">
        <section class="mon-dash-card">
          <h2 class="mon-dash-card-title">命令统计</h2>
          <div class="mon-dash-card-body redis-cmd-panel">
            <div v-if="commands.length" class="redis-donut-stack">
              <div class="redis-donut" :style="{ background: `conic-gradient(${commandStops})` }"></div>
              <div class="redis-donut-hole"></div>
            </div>
            <div v-else class="redis-empty">暂无命令统计</div>
            <ul class="redis-cmd-legend">
              <li v-for="(item, index) in commands" :key="item.name">
                <span class="redis-legend-dot" :style="{ background: COLORS[index % COLORS.length] }"></span>
                <span>{{ item.name }} {{ item.pct.toFixed(1) }}%</span>
              </li>
            </ul>
          </div>
        </section>

        <section class="mon-dash-card">
          <h2 class="mon-dash-card-title">内存信息</h2>
          <div class="mon-dash-card-body redis-mem-panel">
            <div class="redis-gauge-chart">
              <svg class="redis-gauge-svg" viewBox="0 0 200 118" aria-hidden="true">
                <defs>
                  <linearGradient id="redisGaugeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#52c41a" />
                    <stop offset="33.33%" stop-color="#52c41a" />
                    <stop offset="33.33%" stop-color="#1890ff" />
                    <stop offset="66.66%" stop-color="#1890ff" />
                    <stop offset="66.66%" stop-color="#ff4d4f" />
                    <stop offset="100%" stop-color="#ff4d4f" />
                  </linearGradient>
                </defs>
                <path class="redis-gauge-track" d="M 22 96 A 78 78 0 0 1 178 96" fill="none" stroke="#e8eaed" stroke-width="12" stroke-linecap="round" />
                <path class="redis-gauge-arc" d="M 22 96 A 78 78 0 0 1 178 96" fill="none" stroke="url(#redisGaugeStroke)" stroke-width="12" stroke-linecap="round" />
                <g transform="translate(100,96)">
                  <g :transform="`rotate(${gaugeAngle})`">
                    <line x1="0" y1="0" x2="0" y2="-62" class="redis-gauge-needle-line" />
                  </g>
                  <circle class="redis-gauge-hub" cx="0" cy="0" r="4" />
                </g>
              </svg>
              <div class="redis-gauge-center">
                <div class="redis-gauge-title">内存消耗</div>
                <div class="redis-gauge-num">{{ info?.usedMemoryHuman || '0B' }}</div>
              </div>
            </div>
            <div class="redis-gauge-ticks">
              <span>0</span>
              <span>{{ (gaugeScale * 0.25).toFixed(0) }}</span>
              <span>{{ (gaugeScale * 0.5).toFixed(0) }}</span>
              <span>{{ (gaugeScale * 0.75).toFixed(0) }}</span>
              <span>{{ gaugeScale.toFixed(0) }}</span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.redis-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.redis-page-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--admin-muted);
}

.redis-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
}

.redis-refresh-meta {
  font-size: 0.76rem;
  color: var(--admin-muted);
}

.redis-offline {
  padding: 24px;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);

  h3 { margin: 0 0 8px; color: #b45309; font-size: 0.92rem; }
  p { margin: 0; color: var(--admin-muted); font-size: 0.82rem; }
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

.redis-basic-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 18px;
}

.redis-basic-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.redis-basic-label {
  font-size: 0.74rem;
  color: var(--admin-muted);
}

.redis-basic-val {
  font-size: 0.84rem;
  color: var(--admin-text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.redis-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.redis-cmd-panel {
  display: flex;
  align-items: center;
  gap: 28px;
}

.redis-donut-stack {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.redis-donut {
  width: 160px;
  height: 160px;
  border-radius: 50%;
}

.redis-donut-hole {
  position: absolute;
  inset: 26px;
  border-radius: 50%;
  background: var(--admin-card-bg);
}

.redis-cmd-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  flex: 1;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.76rem;
    color: var(--admin-text);
  }
}

.redis-legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.redis-mem-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.redis-gauge-chart {
  position: relative;
  width: 100%;
  max-width: 320px;
}

.redis-gauge-svg {
  width: 100%;
  height: auto;
}

.redis-gauge-track,
.redis-gauge-arc {
  stroke-dasharray: 245;
  stroke-dashoffset: 0;
}

.redis-gauge-arc {
  opacity: 0.9;
}

.redis-gauge-needle-line {
  stroke: #1f2937;
  stroke-width: 3;
  stroke-linecap: round;
}

.redis-gauge-hub {
  fill: #1f2937;
}

.redis-gauge-center {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.redis-gauge-title {
  font-size: 0.72rem;
  color: var(--admin-muted);
}

.redis-gauge-num {
  margin-top: 2px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--admin-text);
}

.redis-gauge-ticks {
  width: 100%;
  max-width: 320px;
  display: flex;
  justify-content: space-between;
  font-size: 0.66rem;
  color: var(--admin-muted);
  padding: 0 10px;
  margin-top: -8px;
}

.redis-empty {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--admin-muted);
  font-size: 0.8rem;
  border: 1px dashed var(--admin-border);
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 1100px) {
  .redis-basic-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .redis-charts-row { grid-template-columns: 1fr; }
}
</style>
