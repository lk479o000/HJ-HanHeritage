<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getPanoramaList,
  createPanorama,
  updatePanorama,
  deletePanorama,
  uploadPanoramaFile,
  PANO_CATEGORIES,
  type PanoramaVo,
  type PanoramaQuery,
} from '@/api/panorama'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const list = ref<PanoramaVo[]>([])
const total = ref(0)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const currentPage = ref(1)
const currentPageSize = ref(10)

function buildQueryParams(page = currentPage.value, pageSize = currentPageSize.value): PanoramaQuery {
  return {
    page,
    pageSize,
    keyword: appliedKeyword.value.trim() || undefined,
  }
}

async function fetchList(page = currentPage.value, pageSize = currentPageSize.value) {
  loading.value = true
  try {
    const res = await getPanoramaList(buildQueryParams(page, pageSize))
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

function categoryClass(cat: string) {
  if (cat === 'air') return 'action-primary'
  if (cat === 'ground') return 'action-success'
  if (cat === 'inner') return 'action-warning'
  return 'action-info'
}

function categoryLabel(cat: string) {
  return PANO_CATEGORIES.find(c => c.key === cat)?.label || cat
}

function statusClass(status: string) {
  if (status === 'published') return 'action-success'
  return 'action-info'
}

function statusLabel(status: string) {
  return status === 'published' ? '已发布' : '草稿'
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

async function toggleStatus(row: PanoramaVo) {
  const newStatus = row.status === 'published' ? 'draft' : 'published'
  try {
    await updatePanorama(row.id, { status: newStatus })
    ElMessage.success(newStatus === 'published' ? '已发布' : '已下线')
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该全景场景？', '提示', { type: 'warning' })
    await deletePanorama(id)
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

const showAdd = ref(false)
const newScene = ref<Partial<PanoramaVo>>({ name: '', category: 'inner', status: 'draft', description: '' })
const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)
const isUploading = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function addScene() {
  if (!newScene.value.name?.trim()) {
    ElMessage.warning('请输入场景名称')
    return
  }
  if (!selectedFile.value) {
    ElMessage.warning('请选择全景文件')
    return
  }
  
  isUploading.value = true
  uploadProgress.value = 0
  
  try {
    const created = await createPanorama(newScene.value)
    uploadProgress.value = 30
    
    await uploadPanoramaFile(created.id, selectedFile.value)
    uploadProgress.value = 100
    
    ElMessage.success('新增成功')
    showAdd.value = false
    newScene.value = { name: '', category: 'inner', status: 'draft', description: '' }
    selectedFile.value = null
    uploadProgress.value = 0
    await fetchList(1)
  } catch {
    /* 请求失败已由拦截器提示 */
  } finally {
    isUploading.value = false
  }
}

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

onMounted(() => fetchList())
</script>

<template>
  <div class="pano-page">
    <AdminPageHeader title="博物馆全景管理" :crumbs="['首页', '业务数据', '博物馆全景管理']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <el-input
          v-model="draftKeyword"
          placeholder="搜索场景名称"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <button type="button" class="btn btn-primary" @click="showAdd = true">新增场景</button>
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
          <el-table-column prop="name" label="场景名称" min-width="180" show-overflow-tooltip align="left" />
          <el-table-column prop="category" label="分类" width="100" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', categoryClass(row.category)]">{{ categoryLabel(row.category) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', statusClass(row.status)]">{{ statusLabel(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip align="left" />
          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="toggleStatus(row)">{{ row.status === 'published' ? '下线' : '发布' }}</button>
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

    <el-dialog v-model="showAdd" title="新增全景场景" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="场景名称"><el-input v-model="newScene.name" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="newScene.category">
            <el-option v-for="c in PANO_CATEGORIES" :key="c.key" :label="c.label" :value="c.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="newScene.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="全景文件">
          <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.mp4,.mov"
            class="hidden-file-input"
            @change="handleFileSelect"
          />
          <el-button @click="triggerFileInput" :disabled="isUploading">
            {{ selectedFile ? selectedFile.name : '选择文件' }}
          </el-button>
          <span v-if="selectedFile" style="margin-left: 8px; color: #64748b; font-size: 0.82rem">
            {{ selectedFile.size > 1024 * 1024 ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : (selectedFile.size / 1024).toFixed(0) + ' KB' }}
          </span>
        </el-form-item>
        <el-form-item v-if="isUploading">
          <el-progress :percentage="uploadProgress" :show-text="true" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="addScene">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.pano-page {
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

.action-primary {
  background: #dbeafe;
  color: #2563eb;
}

.action-success {
  background: #dcfce7;
  color: #16a34a;
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

:deep(.el-select__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
}

.hidden-file-input {
  display: none;
}
</style>
