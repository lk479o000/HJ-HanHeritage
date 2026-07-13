<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getCoffinList,
  getCoffinDetail,
  updateCoffin,
  deleteCoffin,
  COFFIN_REGISTRY_FIELDS,
  EDIT_SECTIONS,
  type CoffinVo,
  type CoffinQuery,
} from '@/api/coffin'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

const loading = ref(false)
const list = ref<CoffinVo[]>([])
const total = ref(0)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const currentPage = ref(1)
const currentPageSize = ref(10)

function buildQueryParams(page = currentPage.value, pageSize = currentPageSize.value): CoffinQuery {
  return {
    page,
    pageSize,
    keyword: appliedKeyword.value.trim() || undefined,
  }
}

async function fetchList(page = currentPage.value, pageSize = currentPageSize.value) {
  loading.value = true
  try {
    const res = await getCoffinList(buildQueryParams(page, pageSize))
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

function relicGradeClass(grade: string) {
  if (grade === '一级文物') return 'action-danger'
  if (grade === '二级文物') return 'action-warning'
  return 'action-info'
}

function onSearch() {
  appliedKeyword.value = draftKeyword.value
  currentPage.value = 1
  fetchList(1)
}

function onReset() {
  draftKeyword.value = ''
  appliedKeyword.value = ''
  currentPage.value = 1
  fetchList(1)
}

function handleSizeChange(size: number) {
  currentPageSize.value = size
  currentPage.value = 1
  fetchList(1, size)
}

const showView = ref(false)
const viewItem = ref<CoffinVo | null>(null)

async function viewCoffin(c: CoffinVo) {
  try {
    const detail = await getCoffinDetail(c.id)
    viewItem.value = detail
    showView.value = true
  } catch {
    viewItem.value = c
    showView.value = true
  }
}

const showEdit = ref(false)
const editItem = ref<CoffinVo | null>(null)
const formRef = ref<FormInstance>()

function editCoffin(c: CoffinVo) {
  editItem.value = { ...c }
  showEdit.value = true
}

async function saveCoffin() {
  if (!editItem.value) return
  try {
    await updateCoffin(editItem.value.id, { ...editItem.value })
    ElMessage.success('保存成功')
    showEdit.value = false
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该石棺记录？', '提示', { type: 'warning' })
    await deleteCoffin(id)
    ElMessage.success('已删除')
    if (list.value.length === 1 && currentPage.value > 1) {
      await fetchList(currentPage.value - 1)
    } else {
      await fetchList()
    }
  } catch {
    /* 用户取消 */
  }
}

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

onMounted(() => fetchList())
</script>

<template>
  <div class="coffin-page">
    <AdminPageHeader title="石棺管理" :crumbs="['首页', '业务数据', '石棺管理']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <el-input
          v-model="draftKeyword"
          placeholder="搜索石棺名称 / 藏品编号"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
      </div>

      <div class="admin-table-wrap" v-loading="loading">
        <el-table
          :data="list"
          border
          class="admin-el-table"
          row-key="id"
          empty-text="无匹配记录"
        >
          <el-table-column
            type="index"
            label="序号"
            width="70"
            :index="(i: number) => (currentPage - 1) * currentPageSize + i + 1"
            align="center"
          />
          <el-table-column prop="title" label="名称" min-width="200" show-overflow-tooltip align="left" />
          <el-table-column prop="collectionId" label="藏品编号" width="150" align="left" />
          <el-table-column prop="dynasty" label="朝代" width="90" align="center" />
          <el-table-column prop="relicGrade" label="文物级别" width="110" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', relicGradeClass(row.relicGrade)]">{{ row.relicGrade }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="completeness" label="完残程度" width="110" align="center" />
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="viewCoffin(row)">查看</button>
                <button type="button" class="btn btn-primary" @click="editCoffin(row)">编辑</button>
                <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="admin-pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="currentPageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="showView" :title="viewItem?.title || ''" width="800px" destroy-on-close>
      <div class="coffin-view" v-if="viewItem">
        <div class="coffin-view__model">
          <div class="model-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <p>3D 模型预览</p>
          </div>
        </div>
        <div class="coffin-view__fields">
          <div v-for="f in COFFIN_REGISTRY_FIELDS" :key="f.key" class="cv-field">
            <span class="cv-label">{{ f.label }}</span>
            <span class="cv-value">{{ viewItem[f.key] || '—' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showEdit" title="编辑石棺" width="720px" destroy-on-close>
      <el-form
        v-if="editItem"
        ref="formRef"
        :model="editItem"
        label-width="120px"
        label-position="right"
        class="coffin-edit-form"
      >
        <div v-for="sec in EDIT_SECTIONS" :key="sec.title" class="ce-section">
          <h4>{{ sec.title }}</h4>
          <div class="ce-grid">
            <el-form-item v-for="k in sec.keys" :key="k" :label="COFFIN_REGISTRY_FIELDS.find(f => f.key === k)?.label || k">
              <el-input v-model="editItem[k]" size="small" />
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveCoffin">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.coffin-page {
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

.action-danger {
  background: #fee2e2;
  color: #dc2626;
}

.action-warning {
  background: #fef9c3;
  color: #d97706;
}

.action-info {
  background: #f1f5f9;
  color: #64748b;
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

.coffin-view {
  .coffin-view__model {
    aspect-ratio: 16 / 9;
    background: #0f172a;
    border-radius: 10px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .model-placeholder {
    text-align: center;
    color: #64748b;

    p { margin: 8px 0 0; font-size: 0.88rem; }
  }

  .coffin-view__fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
  }

  .cv-field {
    display: flex;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px solid var(--admin-border);
  }

  .cv-label {
    color: var(--admin-muted);
    font-size: 0.82rem;
    white-space: nowrap;
    min-width: 120px;
  }

  .cv-value {
    color: var(--admin-text);
    font-size: 0.82rem;
  }
}

.coffin-edit-form {
  max-height: 60vh;
  overflow-y: auto;

  :deep(.el-form-item) {
    margin-bottom: 12px;

    .el-form-item__label {
      font-size: 0.78rem;
      color: var(--admin-muted);
    }
  }

  .ce-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 10px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--admin-text);
      font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--admin-border);
    }
  }

  .ce-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 20px;
  }
}

:deep(.el-dialog) {
  width: 640px !important;
  max-width: calc(100vw - 32px);
  border-radius: 12px;
  border: 1px solid var(--admin-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  background: var(--admin-card-bg);

  .el-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--admin-border);

    .el-dialog__title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--admin-text);
      margin: 0;
    }

    .el-dialog__close {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      font-size: 1.5rem;
      color: var(--admin-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        color: var(--admin-text);
      }
    }
  }

  .el-dialog__body {
    padding: 20px 18px;
    color: var(--admin-text);
    font-size: 0.9rem;
  }

  .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px;
    border-top: 1px solid var(--admin-border);
    background: #fafbfc;
  }
}

:deep(.el-input__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
  border-color: var(--admin-border);
}

:deep(.el-input__inner) {
  font-size: 0.9rem;
  height: 100%;
}
</style>
