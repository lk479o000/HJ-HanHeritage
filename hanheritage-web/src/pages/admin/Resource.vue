<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getResourceList,
  deleteResource,
  uploadResourceFile,
  RESOURCE_TYPE_OPTIONS,
  type ResourceVo,
  type ResourceQuery,
} from '@/api/resource'
import { ElMessage, ElMessageBox } from 'element-plus'

interface ResNode {
  id: string
  label: string
  children?: ResNode[]
}

const treeData = ref<ResNode[]>([
  {
    id: 'f1', label: '崖墓群数据',
    children: [
      { id: 'f1-1', label: '大耳朵崖墓群', children: [
        { id: 'f1-1-1', label: '三维模型' },
        { id: 'f1-1-2', label: '平面影像' },
        { id: 'f1-1-3', label: '扫描数据' },
      ]},
      { id: 'f1-2', label: '洞溪崖墓群', children: [
        { id: 'f1-2-1', label: '三维模型' },
        { id: 'f1-2-2', label: '平面影像' },
      ]},
    ],
  },
  {
    id: 'f2', label: '石棺数据',
    children: [
      { id: 'f2-1', label: '1号棺', children: [
        { id: 'f2-1-1', label: '三维模型' },
        { id: 'f2-1-2', label: '平面影像' },
        { id: 'f2-1-3', label: '数字文档' },
      ]},
      { id: 'f2-2', label: '2号棺', children: [
        { id: 'f2-2-1', label: '三维模型' },
        { id: 'f2-2-2', label: '平面影像' },
      ]},
    ],
  },
  {
    id: 'f3', label: '全景数据',
    children: [
      { id: 'f3-1', label: '空中全景' },
      { id: 'f3-2', label: '地面全景' },
      { id: 'f3-3', label: '内部全景' },
    ],
  },
  {
    id: 'f4', label: '成果数据',
    children: [
      { id: 'f4-1', label: '报告文档' },
      { id: 'f4-2', label: '图纸数据' },
    ],
  },
])

const defaultProps = { children: 'children', label: 'label' }

const loading = ref(false)
const list = ref<ResourceVo[]>([])
const total = ref(0)

const draftKeyword = ref('')
const draftType = ref('')
const appliedKeyword = ref('')
const appliedType = ref('')
const appliedFolderId = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

function buildQueryParams(page = currentPage.value): ResourceQuery {
  return {
    page,
    pageSize: pageSize.value,
    keyword: appliedKeyword.value.trim() || undefined,
    type: appliedType.value || undefined,
    folderId: appliedFolderId.value || undefined,
  }
}

async function fetchList(page = currentPage.value) {
  loading.value = true
  try {
    const res = await getResourceList(buildQueryParams(page))
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

function handleNodeClick(data: ResNode) {
  appliedFolderId.value = data.id
  currentPage.value = 1
  fetchList(1)
}

function onSearch() {
  appliedKeyword.value = draftKeyword.value
  appliedType.value = draftType.value
  currentPage.value = 1
  fetchList(1)
}

function onClearFilter() {
  draftKeyword.value = ''
  draftType.value = ''
  appliedKeyword.value = ''
  appliedType.value = ''
  appliedFolderId.value = ''
  currentPage.value = 1
  fetchList(1)
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchList(1)
}

function typeTagClass(type: string) {
  const map: Record<string, string> = {
    model: 'action-primary',
    image: 'action-success',
    scan: 'action-warning',
    pointcloud: 'action-info',
    doc: 'action-doc',
    video: 'action-danger',
    deliverable: 'action-deliverable',
  }
  return map[type] || 'action-info'
}

function typeLabel(type: string) {
  return RESOURCE_TYPE_OPTIONS.find(o => o.value === type)?.label || type
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该资源？', '提示', { type: 'warning' })
    await deleteResource(id)
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

const showUpload = ref(false)
const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadFolderId = ref('')
const uploadType = ref('')

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

async function handleUpload() {
  if (!uploadFolderId.value) {
    ElMessage.warning('请选择目标目录')
    return
  }
  if (!uploadType.value) {
    ElMessage.warning('请选择资源类型')
    return
  }
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  
  isUploading.value = true
  uploadProgress.value = 0
  
  try {
    await uploadResourceFile(selectedFile.value, uploadFolderId.value, uploadType.value)
    uploadProgress.value = 100
    
    ElMessage.success('上传成功')
    showUpload.value = false
    selectedFile.value = null
    uploadFolderId.value = ''
    uploadType.value = ''
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
  <div class="resource-page">
    <AdminPageHeader title="资源管理" :crumbs="['首页', '业务数据', '资源管理']" />
    <div class="res-layout">
      <div class="res-tree-card">
        <div class="res-tree-header">
          <h3>目录结构</h3>
        </div>
        <div class="res-tree-body">
          <el-tree :data="treeData" :props="defaultProps" node-key="id" highlight-current @node-click="handleNodeClick" default-expand-all />
        </div>
      </div>

      <div class="res-main">
        <div class="admin-toolbar">
          <el-select v-model="draftType" placeholder="资源类型" clearable class="toolbar-type">
            <el-option v-for="t in RESOURCE_TYPE_OPTIONS.filter(o => o.value)" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-input
            v-model="draftKeyword"
            placeholder="搜索文件名"
            clearable
            class="toolbar-search"
            @keyup.enter="onSearch"
          />
          <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
          <button type="button" class="btn" @click="onClearFilter">清除筛选</button>
          <div class="toolbar-spacer"></div>
          <button type="button" class="btn btn-primary" @click="showUpload = true">上传资源</button>
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
              :index="(i: number) => (currentPage - 1) * pageSize + i + 1"
              align="center"
            />
            <el-table-column prop="name" label="文件名" min-width="220" align="left" show-overflow-tooltip />
            <el-table-column label="类型" width="110" align="center">
              <template #default="{ row }">
                <span :class="['action-tag', typeTagClass(row.type)]">{{ typeLabel(row.type) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100" align="right" />
            <el-table-column prop="updatedAt" label="更新时间" width="120" align="center" />
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <div class="admin-table-actions">
                  <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="admin-pagination" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="showUpload" title="上传资源" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <input
          ref="fileInputRef"
          type="file"
          class="hidden-file-input"
          @change="handleFileSelect"
        />
        <el-form-item label="目标目录">
          <el-select v-model="uploadFolderId" placeholder="选择目录" style="width: 100%">
            <el-option label="崖墓群数据 / 大耳朵 / 三维模型" value="f1-1-1" />
            <el-option label="崖墓群数据 / 大耳朵 / 平面影像" value="f1-1-2" />
            <el-option label="石棺数据 / 1号棺 / 三维模型" value="f2-1-1" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="uploadType" style="width: 100%">
            <el-option v-for="t in RESOURCE_TYPE_OPTIONS.filter(o => o.value)" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-button @click="triggerFileInput" :disabled="isUploading">
            {{ selectedFile ? selectedFile.name : '选择文件' }}
          </el-button>
          <span v-if="selectedFile" style="margin-left: 8px; color: #64748b; font-size: 0.82rem">
            {{ selectedFile.size > 1024 * 1024 ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : (selectedFile.size / 1024).toFixed(0) + ' KB' }}
          </span>
          <span v-else style="margin-left: 8px; color: #64748b; font-size: 0.82rem">支持 GLB/OBJ/JPG/PDF/LAS/MP4 等格式</span>
        </el-form-item>
        <el-form-item v-if="isUploading">
          <el-progress :percentage="uploadProgress" :show-text="true" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false" :disabled="isUploading">取消</el-button>
        <el-button type="primary" @click="handleUpload" :disabled="isUploading">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.resource-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.res-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  min-height: 500px;
}

.res-tree-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.res-tree-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--admin-border);
  background: #fafbfc;

  h3 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--admin-heading);
    font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
  }
}

.res-tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.res-main {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.admin-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--admin-border);
}

.toolbar-type {
  width: 160px;
}

.toolbar-search {
  width: 220px;
}

.toolbar-spacer {
  flex: 1;
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

.action-danger {
  background: #fee2e2;
  color: #dc2626;
}

.action-info {
  background: #f1f5f9;
  color: #64748b;
}

.action-doc {
  background: #e0e7ff;
  color: #4f46e5;
}

.action-deliverable {
  background: #fce7f3;
  color: #db2777;
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

@media (max-width: 768px) {
  .res-layout {
    grid-template-columns: 1fr;
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
