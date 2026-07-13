<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const redisInfo = ref({
  version: '7.2.4',
  mode: 'Standalone',
  port: '6379',
  uptime: '15天6小时',
  connectedClients: '12',
  usedMemory: '128.5 MB',
  usedMemoryPeak: '256.3 MB',
  totalSystemMemory: '8 GB',
  maxMemory: '2 GB',
  memFragmentationRatio: '1.02',
  keyspaceHits: '1,245,678',
  keyspaceMisses: '34,521',
  hitRate: '97.3%',
  totalConnectionsReceived: '56,789',
  totalCommandsProcessed: '8,234,567',
  instantaneousOpsPerSec: '1,234',
  rejectedConnections: '0',
  expiredKeys: '12,345',
  evictedKeys: '0',
})

const commandStats = ref([
  { command: 'GET', count: 3450000, color: '#2563eb' },
  { command: 'SET', count: 2100000, color: '#7c3aed' },
  { command: 'HGET', count: 890000, color: '#059669' },
  { command: 'HSET', count: 670000, color: '#d97706' },
  { command: 'DEL', count: 450000, color: '#dc2626' },
  { command: 'EXPIRE', count: 230000, color: '#0891b2' },
  { command: 'KEYS', count: 120000, color: '#a855f7' },
  { command: 'OTHER', count: 324567, color: '#64748b' },
])

const totalCommands = computed(() => commandStats.value.reduce((s, c) => s + c.count, 0))

const conicStops = computed(() => {
  let cumulative = 0
  const stops: string[] = []
  commandStats.value.forEach(s => {
    const start = cumulative
    cumulative += s.count / totalCommands.value
    stops.push(`${s.color} ${start * 360}deg ${(cumulative) * 360}deg`)
  })
  return stops.join(', ')
})

const memPercent = computed(() => {
  const used = parseFloat(redisInfo.value.usedMemory)
  const max = parseFloat(redisInfo.value.maxMemory)
  return Math.min(100, (used / max) * 100)
})

const semicircleR = 80
const semicircleC = Math.PI * semicircleR
const semicircleOffset = computed(() => semicircleC - (memPercent.value / 100) * semicircleC)

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    redisInfo.value.connectedClients = String(10 + Math.floor(Math.random() * 8))
    redisInfo.value.instantaneousOpsPerSec = String(1000 + Math.floor(Math.random() * 500))
  }, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="redis-page">
    <AdminPageHeader title="缓存监控" :crumbs="['首页', '运维监控', '缓存监控']" />
    <div class="redis-row">
      <div class="redis-info-card">
        <div class="redis-info-header">
          <h3>Redis 信息</h3>
        </div>
        <div class="redis-info-grid">
          <div class="ri-item"><span class="ri-label">版本</span><span class="ri-value">{{ redisInfo.version }}</span></div>
          <div class="ri-item"><span class="ri-label">运行模式</span><span class="ri-value">{{ redisInfo.mode }}</span></div>
          <div class="ri-item"><span class="ri-label">端口</span><span class="ri-value">{{ redisInfo.port }}</span></div>
          <div class="ri-item"><span class="ri-label">运行时长</span><span class="ri-value">{{ redisInfo.uptime }}</span></div>
          <div class="ri-item"><span class="ri-label">连接客户端</span><span class="ri-value">{{ redisInfo.connectedClients }}</span></div>
          <div class="ri-item"><span class="ri-label">已用内存</span><span class="ri-value">{{ redisInfo.usedMemory }}</span></div>
          <div class="ri-item"><span class="ri-label">内存峰值</span><span class="ri-value">{{ redisInfo.usedMemoryPeak }}</span></div>
          <div class="ri-item"><span class="ri-label">最大内存</span><span class="ri-value">{{ redisInfo.maxMemory }}</span></div>
          <div class="ri-item"><span class="ri-label">系统总内存</span><span class="ri-value">{{ redisInfo.totalSystemMemory }}</span></div>
          <div class="ri-item"><span class="ri-label">碎片率</span><span class="ri-value">{{ redisInfo.memFragmentationRatio }}</span></div>
          <div class="ri-item"><span class="ri-label">命中次数</span><span class="ri-value">{{ redisInfo.keyspaceHits }}</span></div>
          <div class="ri-item"><span class="ri-label">未命中次数</span><span class="ri-value">{{ redisInfo.keyspaceMisses }}</span></div>
          <div class="ri-item"><span class="ri-label">命中率</span><span class="ri-value">{{ redisInfo.hitRate }}</span></div>
          <div class="ri-item"><span class="ri-label">总连接数</span><span class="ri-value">{{ redisInfo.totalConnectionsReceived }}</span></div>
          <div class="ri-item"><span class="ri-label">总命令数</span><span class="ri-value">{{ redisInfo.totalCommandsProcessed }}</span></div>
          <div class="ri-item"><span class="ri-label">每秒操作</span><span class="ri-value">{{ redisInfo.instantaneousOpsPerSec }}</span></div>
          <div class="ri-item"><span class="ri-label">拒绝连接</span><span class="ri-value">{{ redisInfo.rejectedConnections }}</span></div>
          <div class="ri-item"><span class="ri-label">已过期键</span><span class="ri-value">{{ redisInfo.expiredKeys }}</span></div>
          <div class="ri-item"><span class="ri-label">已驱逐键</span><span class="ri-value">{{ redisInfo.evictedKeys }}</span></div>
        </div>
      </div>

      <div class="redis-charts-col">
        <div class="redis-chart-card">
          <div class="redis-info-header">
            <h3>命令统计</h3>
          </div>
          <div class="redis-chart-body">
            <div class="conic-chart" :style="{ background: `conic-gradient(from 0deg, ${conicStops})` }">
              <div class="conic-hole"></div>
            </div>
            <div class="conic-legend">
              <div v-for="s in commandStats" :key="s.command" class="legend-item">
                <span class="legend-dot" :style="{ background: s.color }"></span>
                <span class="legend-label">{{ s.command }}</span>
                <span class="legend-val">{{ (s.count / totalCommands * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="redis-chart-card">
          <div class="redis-info-header">
            <h3>内存使用率</h3>
          </div>
          <div class="redis-chart-body mem-gauge-body">
            <svg viewBox="0 0 200 120" width="200" height="120" class="mem-gauge">
              <path :d="`M 20 100 A ${semicircleR} ${semicircleR} 0 0 1 180 100`" fill="none" stroke="#e2e8f0" stroke-width="12" stroke-linecap="round" />
              <path :d="`M 20 100 A ${semicircleR} ${semicircleR} 0 0 1 180 100`" fill="none" :stroke="memPercent > 80 ? '#dc2626' : memPercent > 60 ? '#d97706' : '#2563eb'" stroke-width="12" stroke-linecap="round"
                :stroke-dasharray="semicircleC"
                :stroke-dashoffset="semicircleOffset"
                style="transition: stroke-dashoffset 0.8s ease" />
            </svg>
            <div class="mem-gauge-text">
              <span class="mg-val">{{ memPercent.toFixed(1) }}%</span>
              <span class="mg-detail">{{ redisInfo.usedMemory }} / {{ redisInfo.maxMemory }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redis-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.redis-row {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
}

.redis-info-card, .redis-chart-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.redis-info-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--admin-border);
  background: linear-gradient(180deg, rgba(90, 155, 138, 0.05) 0%, transparent 100%);

  h3 { 
    margin: 0; 
    font-size: 0.92rem; 
    font-weight: 600; 
    color: var(--admin-muted);
    font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
  }
}

.redis-info-grid {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}

.ri-item {
  display: flex;
  gap: 8px;
}

.ri-label {
  color: var(--admin-muted);
  font-size: 0.85rem;
  min-width: 80px;
  white-space: nowrap;
}

.ri-value {
  color: var(--admin-text);
  font-size: 0.85rem;
  font-weight: 500;
}

.redis-charts-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.redis-chart-body {
  padding: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.conic-chart {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.conic-hole {
  position: absolute;
  top: 30px;
  left: 30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--admin-card-bg);
}

.conic-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-label { color: var(--admin-muted); min-width: 50px; }
.legend-val { color: var(--admin-text); font-weight: 600; }

.mem-gauge-body {
  flex-direction: column;
  align-items: center;
}

.mem-gauge { display: block; }

.mem-gauge-text {
  text-align: center;
  margin-top: -10px;
}

.mg-val {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--admin-muted);
}

.mg-detail {
  display: block;
  font-size: 0.78rem;
  color: var(--admin-muted);
  margin-top: 2px;
}

@media (max-width: 900px) {
  .redis-row {
    grid-template-columns: 1fr;
  }
}
</style>
