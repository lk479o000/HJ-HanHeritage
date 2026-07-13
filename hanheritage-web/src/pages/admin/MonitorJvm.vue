<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

interface GaugeData {
  label: string
  value: number
  max: number
  unit: string
  color: string
}

const cpu = ref<GaugeData>({ label: 'CPU 使用率', value: 23.5, max: 100, unit: '%', color: '#2563eb' })
const memory = ref<GaugeData>({ label: '内存使用', value: 62.3, max: 100, unit: '%', color: '#7c3aed' })
const jvm = ref<GaugeData>({ label: 'JVM 内存', value: 45.8, max: 100, unit: '%', color: '#059669' })
const disk = ref<GaugeData>({ label: '磁盘使用', value: 38.2, max: 100, unit: '%', color: '#d97706' })
const server = ref<GaugeData>({ label: '服务器负载', value: 31.0, max: 100, unit: '%', color: '#dc2626' })

const gauges = computed(() => [cpu.value, memory.value, jvm.value, server.value, disk.value])

const jvmInfo = ref({
  maxMemory: '512 MB',
  totalMemory: '256 MB',
  freeMemory: '139 MB',
  usedMemory: '117 MB',
  availableProcessors: '4',
  javaVersion: '17.0.6',
  javaHome: '/usr/lib/jvm/java-17',
  osName: 'Linux',
  osArch: 'amd64',
  osVersion: '5.15.0',
  startTime: '2026-05-20 08:30:00',
  runTime: '2天3小时',
})

let timer: ReturnType<typeof setInterval> | null = null

function simulate() {
  cpu.value.value = Math.min(100, Math.max(0, cpu.value.value + (Math.random() - 0.5) * 8))
  memory.value.value = Math.min(100, Math.max(0, memory.value.value + (Math.random() - 0.5) * 4))
  jvm.value.value = Math.min(100, Math.max(0, jvm.value.value + (Math.random() - 0.5) * 6))
  server.value.value = Math.min(100, Math.max(0, server.value.value + (Math.random() - 0.5) * 5))
  disk.value.value = Math.min(100, Math.max(38, disk.value.value + (Math.random() - 0.5) * 0.5))
}

onMounted(() => {
  timer = setInterval(simulate, 2000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function gaugeStroke(g: GaugeData): string {
  const r = 40
  const c = 2 * Math.PI * r
  const offset = c - (g.value / g.max) * c
  return `stroke-dasharray: ${c}; stroke-dashoffset: ${offset};`
}

function gaugeColor(g: GaugeData): string {
  if (g.value > 80) return '#dc2626'
  if (g.value > 60) return '#d97706'
  return g.color
}
</script>

<template>
  <div class="jvm-page">
    <AdminPageHeader title="服务监控" :crumbs="['首页', '运维监控', '服务监控']" />
    <div class="jvm-gauges">
      <div v-for="g in gauges" :key="g.label" class="gauge-card">
        <div class="gauge-ring">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="8" />
            <circle cx="50" cy="50" r="40" fill="none" :stroke="gaugeColor(g)" stroke-width="8"
              :style="gaugeStroke(g)"
              stroke-linecap="round"
              transform="rotate(-90 50 50)"
              style="transition: stroke-dashoffset 0.8s ease" />
          </svg>
          <div class="gauge-value">
            <span class="gv-num">{{ g.value.toFixed(1) }}</span>
            <span class="gv-unit">{{ g.unit }}</span>
          </div>
        </div>
        <div class="gauge-label">{{ g.label }}</div>
      </div>
    </div>

    <div class="jvm-info-card">
      <div class="jvm-info-header">
        <h3>JVM 信息</h3>
      </div>
      <div class="jvm-info-grid">
        <div class="ji-item"><span class="ji-label">最大内存</span><span class="ji-value">{{ jvmInfo.maxMemory }}</span></div>
        <div class="ji-item"><span class="ji-label">已分配内存</span><span class="ji-value">{{ jvmInfo.totalMemory }}</span></div>
        <div class="ji-item"><span class="ji-label">空闲内存</span><span class="ji-value">{{ jvmInfo.freeMemory }}</span></div>
        <div class="ji-item"><span class="ji-label">已使用内存</span><span class="ji-value">{{ jvmInfo.usedMemory }}</span></div>
        <div class="ji-item"><span class="ji-label">处理器数</span><span class="ji-value">{{ jvmInfo.availableProcessors }}</span></div>
        <div class="ji-item"><span class="ji-label">Java 版本</span><span class="ji-value">{{ jvmInfo.javaVersion }}</span></div>
        <div class="ji-item"><span class="ji-label">Java Home</span><span class="ji-value">{{ jvmInfo.javaHome }}</span></div>
        <div class="ji-item"><span class="ji-label">操作系统</span><span class="ji-value">{{ jvmInfo.osName }}</span></div>
        <div class="ji-item"><span class="ji-label">系统架构</span><span class="ji-value">{{ jvmInfo.osArch }}</span></div>
        <div class="ji-item"><span class="ji-label">系统版本</span><span class="ji-value">{{ jvmInfo.osVersion }}</span></div>
        <div class="ji-item"><span class="ji-label">启动时间</span><span class="ji-value">{{ jvmInfo.startTime }}</span></div>
        <div class="ji-item"><span class="ji-label">运行时长</span><span class="ji-value">{{ jvmInfo.runTime }}</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.jvm-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.jvm-gauges {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.gauge-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.gauge-ring {
  position: relative;
  display: inline-block;
}

.gauge-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.gv-num {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--admin-muted);
}

.gv-unit {
  font-size: 0.72rem;
  color: var(--admin-muted);
  display: block;
}

.gauge-label {
  margin-top: 8px;
  font-size: 0.82rem;
  color: var(--admin-muted);
}

.jvm-info-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.jvm-info-header {
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

.jvm-info-grid {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px 24px;
}

.ji-item {
  display: flex;
  gap: 8px;
}

.ji-label {
  color: var(--admin-muted);
  font-size: 0.85rem;
  min-width: 90px;
  white-space: nowrap;
}

.ji-value {
  color: var(--admin-text);
  font-size: 0.85rem;
  font-weight: 500;
}

@media (max-width: 900px) {
  .jvm-gauges {
    grid-template-columns: repeat(3, 1fr);
  }
  .jvm-info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
