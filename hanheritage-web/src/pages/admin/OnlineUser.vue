<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getOnlineUsers,
  forceLogout,
  fmtDate,
  type OnlineUser,
  type OnlineUserQuery,
} from '@/api/system'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const list = ref<OnlineUser[]>([])
const total = ref(0)

const currentPage = ref(1)
const pageSize = ref(10)

function buildQueryParams(page = currentPage.value): OnlineUserQuery {
  return {
    page,
    pageSize: pageSize.value,
  }
}

async function fetchList(page = currentPage.value) {
  loading.value = true
  try {
    const res = await getOnlineUsers(buildQueryParams(page))
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

async function handleForceLogout(u: OnlineUser) {
  try {
    await ElMessageBox.confirm(`确定要强制下线用户「${u.name}」吗？`, '提示', { type: 'warning' })
    await forceLogout(u.id)
    ElMessage.success(`已强制下线 ${u.name}`)
    if (list.value.length === 1 && currentPage.value > 1) {
      await fetchList(currentPage.value - 1)
    } else {
      await fetchList()
    }
  } catch {
    /* 用户取消 */
  }
}

function handleRefresh() {
  currentPage.value = 1
  fetchList(1)
}

function handleSizeChange() {
  currentPage.value = 1
  fetchList(1)
}

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

onMounted(() => fetchList())
</script>

<template>
  <div class="online-page">
    <AdminPageHeader title="在线用户" :crumbs="['首页', '日志与在线', '在线用户']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <button type="button" class="btn btn-primary" @click="handleRefresh">刷新</button>
      </div>

      <div class="admin-table-wrap" v-loading="loading">
        <el-table
          :data="list"
          border
          class="admin-el-table"
          row-key="id"
          empty-text="无在线用户"
        >
          <el-table-column
            type="index"
            label="序号"
            width="70"
            :index="(i: number) => (currentPage - 1) * pageSize + i + 1"
            align="center"
          />
          <el-table-column prop="name" label="用户" width="120" align="left" />
          <el-table-column prop="dept" label="部门" width="120" align="left" />
          <el-table-column label="登录时间" width="160" align="center">
            <template #default="{ row }">{{ fmtDate(row.loginAt) }}</template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" width="140" align="left" />
          <el-table-column prop="client" label="客户端" min-width="200" show-overflow-tooltip align="left" />
          <el-table-column label="操作" width="110" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn btn-danger" @click="handleForceLogout(row)">强制下线</button>
              </div>
            </template>
          </el-table-column>
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
.online-page {
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
