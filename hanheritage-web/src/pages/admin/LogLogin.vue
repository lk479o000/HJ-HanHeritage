<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getLoginLogs,
  deleteLoginLogs,
  clearLoginLogs,
  exportLoginLogs,
  fmtDate,
  type LoginLog,
  type LoginLogQuery,
} from '@/api/system'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElTable } from 'element-plus'

const loading = ref(false)
const list = ref<LoginLog[]>([])
const total = ref(0)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const tableRef = ref<InstanceType<typeof ElTable>>()
const selectedRows = ref<LoginLog[]>([])

const currentPage = ref(1)
const pageSize = ref(10)

function buildQueryParams(page = currentPage.value): LoginLogQuery {
  return {
    page,
    pageSize: pageSize.value,
    keyword: appliedKeyword.value.trim() || undefined,
  }
}

async function fetchList(page = currentPage.value) {
  loading.value = true
  try {
    const res = await getLoginLogs(buildQueryParams(page))
    list.value = res.items
    total.value = res.total
    currentPage.value = res.page
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows: LoginLog[]) {
  selectedRows.value = rows
}

function onSearch() {
  appliedKeyword.value = draftKeyword.value
  currentPage.value = 1
  tableRef.value?.clearSelection()
  fetchList(1)
}

function onReset() {
  draftKeyword.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1
  tableRef.value?.clearSelection()
  fetchList(1)
}

async function deleteSelected() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要删除的日志')
    return
  }
  const count = selectedRows.value.length
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${count} 条登录日志？`, '提示', { type: 'warning' })
    const res = await deleteLoginLogs(selectedRows.value.map(r => r.id))
    tableRef.value?.clearSelection()
    ElMessage.success(`已删除 ${res.deleted ?? count} 条`)
    await fetchList()
  } catch {
    /* 用户取消 */
  }
}

async function clearAllLogs() {
  if (!total.value) {
    ElMessage.warning('当前没有可清空的日志')
    return
  }
  try {
    await ElMessageBox.confirm('确定清空全部登录日志？此操作不可恢复。', '提示', { type: 'warning' })
    const res = await clearLoginLogs()
    tableRef.value?.clearSelection()
    currentPage.value = 1
    ElMessage.success(`已清空 ${res.deleted ?? 0} 条`)
    await fetchList(1)
  } catch {
    /* 用户取消 */
  }
}

async function exportLogs() {
  try {
    const { items } = await exportLoginLogs()
    if (!items.length) {
      ElMessage.warning('无可导出数据')
      return
    }
    const csv = ['时间,账号,IP,结果,消息']
    items.forEach((l: LoginLog) => {
      const line = [fmtDate(l.at), l.account, l.ip, l.result, l.message || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
      csv.push(line)
    })
    const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `登录日志_${fmtDate(Date.now()).replace(/[:\s]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已导出 ${items.length} 条`)
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

function handleSizeChange() {
  currentPage.value = 1
  fetchList(1)
}

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

watch(pageSize, () => {
  currentPage.value = 1
  fetchList(1)
})

onMounted(() => fetchList())
</script>

<template>
  <div class="log-login-page">
    <AdminPageHeader title="登录日志" :crumbs="['首页', '日志与在线', '登录日志']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <el-input
          v-model="draftKeyword"
          placeholder="搜索账号 / IP / 说明"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <button type="button" class="btn" @click="exportLogs">导出</button>
        <button type="button" class="btn btn-danger" @click="deleteSelected">删除所选</button>
        <button type="button" class="btn btn-danger" @click="clearAllLogs">清空日志</button>
      </div>

      <div class="admin-table-wrap" v-loading="loading">
        <el-table
          ref="tableRef"
          :data="list"
          border
          class="admin-el-table"
          row-key="id"
          empty-text="无匹配记录"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column label="时间" width="160" align="center">
            <template #default="{ row }">{{ fmtDate(row.at) }}</template>
          </el-table-column>
          <el-table-column prop="account" label="账号" width="130" align="left" />
          <el-table-column prop="ip" label="IP" width="140" align="left" />
          <el-table-column label="结果" width="90" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', row.result === '成功' ? 'action-success' : 'action-danger']">{{ row.result }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" min-width="140" show-overflow-tooltip align="left" />
        </el-table>
      </div>

      <div class="admin-pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.log-login-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.admin-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--admin-border);
}

.toolbar-search {
  width: 260px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: var(--admin-touch, 38px);
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: #fff;
  color: var(--admin-text);
  font-size: 0.88rem;
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: all 0.15s ease;

  &:hover {
    background: #f8fafc;
  }
}

.btn-primary {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  color: #fff;

  &:hover {
    background: var(--admin-primary-hover);
  }
}

.btn-danger {
  background: #fff;
  border-color: #fecaca;
  color: var(--admin-danger, #dc2626);

  &:hover {
    background: #fef2f2;
  }
}

.admin-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 10px 10px 10px 10px;
}

.admin-table-wrap :deep(.admin-el-table) {
  --el-table-border-color: var(--admin-border);
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f1f5f9;
  --el-table-text-color: var(--admin-text);
  --el-table-header-text-color: var(--admin-text);
  width: 100%;
  font-size: 0.88rem;

  &::before,
  &::after {
    display: none;
  }

  .el-table__inner-wrapper::before {
    display: none;
  }

  th.el-table__cell {
    background: #f8fafc;
    font-weight: 600;
    color: var(--admin-text);
    padding: 10px 0;
  }

  td.el-table__cell {
    padding: 10px 0;
    color: var(--admin-text);
  }

  .el-table-column--selection .cell {
    padding-left: 8px;
    padding-right: 8px;
  }

  .el-table__body tr:nth-child(even) td.el-table__cell {
    background: #fafbfc;
  }

  .el-table__body tr:hover > td.el-table__cell {
    background: #f1f5f9;
  }

  .el-table-fixed-column--right {
    background: inherit;
  }

  .el-table__body tr:nth-child(even) .el-table-fixed-column--right {
    background: #fafbfc;
  }

  .el-table__body tr:hover > .el-table-fixed-column--right {
    background: #f1f5f9;
  }
}

.action-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.82rem;
}

.action-success {
  background: #dcfce7;
  color: #16a34a;
}

.action-danger {
  background: #fee2e2;
  color: #dc2626;
}

.admin-table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.admin-table-actions .btn {
  min-height: 34px;
  padding: 0 10px;
  font-size: 0.84rem;
}

.admin-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--admin-border);
  background: #fafbfc;
}

.admin-pagination :deep(.el-pagination) {
  .el-pager li {
    font-size: 0.88rem;
    min-width: 32px;
    height: 32px;
    line-height: 32px;
  }
  .btn-prev,
  .btn-next {
    min-width: 32px;
    height: 32px;
    line-height: 32px;
  }
}
</style>
