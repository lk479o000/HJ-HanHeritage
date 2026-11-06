<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getServerInfo } from '@/api/system'
import type { ServerInfo } from '@/api/system'

const loading = ref(false)
const info = ref<ServerInfo | null>(null)

function formatBytes(bytes?: number) {
  const value = bytes || 0
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(2)} MB`
  return `${value} B`
}

const diskSummary = computed(() => {
  const disks = info.value?.disks || []
  if (!disks.length) return '—'
  return disks
    .map(disk => `${disk.mount} ${formatBytes(disk.total)}（使用率 ${disk.usagePct.toFixed(1)}%）`)
    .join('；')
})

async function load() {
  loading.value = true
  try {
    info.value = await getServerInfo()
  } catch (error: any) {
    ElMessage.error(error?.message || '服务器信息加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="server-page" v-loading="loading">
    <AdminPageHeader title="服务器" :crumbs="['首页', '运维监控', '服务器']" />
    <p class="server-page-desc">硬件与系统信息 · 虚拟机监控（数据来自 API 主机实时采集）</p>

    <section class="admin-card server-card">
      <h2>硬件与系统</h2>
      <div class="admin-table-wrap">
        <table class="server-table">
          <tbody>
            <tr><th>CPU</th><td>{{ info ? `${info.cpuCount} 核 · ${info.cpuModel}` : '—' }}</td></tr>
            <tr><th>内存</th><td>{{ info ? `${formatBytes(info.totalMemory)} · 使用率 ${info.memoryPct.toFixed(1)}%` : '—' }}</td></tr>
            <tr><th>磁盘</th><td>{{ diskSummary }}</td></tr>
            <tr><th>操作系统</th><td>{{ info ? `${info.osType} ${info.osRelease} ${info.arch}` : '—' }}</td></tr>
            <tr><th>IP</th><td>{{ info?.ip || '—' }}</td></tr>
            <tr><th>架构</th><td>{{ info?.arch || '—' }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="admin-card server-card">
      <h2>虚拟机监控</h2>
      <p class="server-page-desc server-page-desc--inline">虚拟机硬件与运行状态（与「服务监控」配合）</p>
      <div class="admin-table-wrap">
        <table class="server-table server-table--vm">
          <thead>
            <tr><th>虚拟机</th><th>状态</th><th>CPU</th><th>内存</th></tr>
          </thead>
          <tbody>
            <tr v-for="node in info?.nodes || []" :key="node.name">
              <td>{{ node.name }}</td>
              <td><span class="server-tag">{{ node.status }}</span></td>
              <td>{{ node.cpuPct.toFixed(1) }}%</td>
              <td>{{ formatBytes(node.memUsed) }} / {{ formatBytes(node.memTotal) }}</td>
            </tr>
            <tr v-if="!(info?.nodes || []).length"><td colspan="4" class="server-empty">暂无节点数据</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.server-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.server-page-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--admin-muted);
}

.server-page-desc--inline {
  margin-top: 0;
  margin-bottom: 12px;
}

.server-card {
  padding: 18px 20px;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);

  h2 {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--admin-text);
    font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
  }
}

.server-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;

  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(90, 155, 138, 0.15);
    text-align: left;
  }

  th {
    width: 180px;
    color: var(--admin-muted);
    font-weight: 500;
    background: rgba(90, 155, 138, 0.04);
  }

  td { color: var(--admin-text); }
}

.server-table--vm th {
  width: auto;
  background: rgba(90, 155, 138, 0.08);
  color: var(--admin-text);
}

.server-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  font-size: 0.72rem;
}

.server-empty {
  text-align: center;
  color: var(--admin-muted);
}
</style>
