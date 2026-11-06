<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getResourceList,
  getResourceTree,
  deleteResource,
  deleteResources,
  createResource,
  updateResource,
  uploadResourceFile,
  RESOURCE_TYPE_OPTIONS,
  type ResourceNode,
  type ResourceVo,
  type ResourceQuery,
} from '@/api/resource'

const loading = ref(false)
const treeLoading = ref(false)
const list = ref<ResourceVo[]>([])
const total = ref(0)
const treeRaw = ref<ResourceNode[]>([])
const selectedRows = ref<ResourceVo[]>([])

const currentFolderId = ref('')
const draftKeyword = ref('')
const draftType = ref('')
const appliedKeyword = ref('')
const appliedType = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadVisible = ref(false)
const uploadForm = reactive({ folderId: '', type: '', remark: '', file: null as File | null })
const uploadProgress = ref(0)
const isUploading = ref(false)

const editVisible = ref(false)
const editForm = reactive({ id: '', name: '', type: 'doc', remark: '' })

const folderVisible = ref(false)
const folderForm = reactive({ mode: 'create' as 'create' | 'rename', id: '', parentId: '', name: '' })

const previewVisible = ref(false)
const previewRow = ref<ResourceVo | null>(null)

const folderTree = computed(() => toFolderTree(treeRaw.value))

function toFolderTree(nodes: ResourceNode[]): ResourceNode[] {
  return nodes
    .filter(node => node.type === 'folder')
    .map(node => ({
      ...node,
      children: toFolderTree(node.children || []),
    }))
}

const flatFolders = computed(() => {
  const result: Array<{ id: string; name: string; level: number }> = []
  const walk = (nodes: ResourceNode[], level: number) => {
    nodes.forEach(node => {
      result.push({ id: node.id, name: node.name, level })
      walk(node.children || [], level + 1)
    })
  }
  walk(folderTree.value, 1)
  return result
})

const stats = computed(() => {
  let count = 0
  let bytes = 0
  const walk = (nodes: ResourceNode[]) => {
    nodes.forEach(node => {
      if (node.type !== 'folder') {
        count += 1
        bytes += node.fileSize || 0
      }
      walk(node.children || [])
    })
  }
  walk(treeRaw.value)
  return { count, bytes, folderCount: list.value.length }
})

const previewExt = computed(() => extOf(previewRow.value?.name || ''))
const previewType = computed(() => {
  const ext = previewExt.value
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['glb', 'gltf'].includes(ext)) return 'model'
  return 'other'
})

const modelViewerReady = ref(false)

async function ensureModelViewer() {
  if (modelViewerReady.value) return
  try {
    await import('@google/model-viewer')
    modelViewerReady.value = true
  } catch {
    /* 本地依赖不可用时保持提示 */
  }
}

function extOf(name: string) {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function typeLabel(type: string) {
  return RESOURCE_TYPE_OPTIONS.find(option => option.value === type)?.label || type
}

function buildQueryParams(page = currentPage.value): ResourceQuery {
  return {
    page,
    pageSize: pageSize.value,
    keyword: appliedKeyword.value.trim() || undefined,
    type: appliedType.value || undefined,
    folderId: currentFolderId.value || undefined,
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

async function fetchTree() {
  treeLoading.value = true
  try {
    treeRaw.value = await getResourceTree()
  } catch {
    treeRaw.value = []
  } finally {
    treeLoading.value = false
  }
}

function handleNodeClick(data: ResourceNode) {
  currentFolderId.value = data.id
  currentPage.value = 1
  fetchList(1)
}

function selectAllResources() {
  currentFolderId.value = ''
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
  currentPage.value = 1
  fetchList(1)
}

function handleSizeChange() {
  currentPage.value = 1
  fetchList(1)
}

function handleSelectionChange(rows: ResourceVo[]) {
  selectedRows.value = rows
}

async function handleDelete(row: ResourceVo) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteResource(row.id)
    ElMessage.success('已删除')
    await Promise.all([fetchList(currentPage.value), fetchTree()])
  } catch {
    /* 用户取消 */
  }
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要删除的资源')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 项资源吗？`, '批量删除', { type: 'warning' })
    await deleteResources(selectedRows.value.map(row => row.id))
    ElMessage.success('已批量删除')
    await Promise.all([fetchList(1), fetchTree()])
  } catch {
    /* 用户取消 */
  }
}

function openUpload() {
  uploadForm.folderId = currentFolderId.value
  uploadForm.type = ''
  uploadForm.remark = ''
  uploadForm.file = null
  uploadProgress.value = 0
  uploadVisible.value = true
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  uploadForm.file = file
  if (file && !uploadForm.type) {
    const ext = extOf(file.name)
    if (['glb', 'gltf', 'obj'].includes(ext)) uploadForm.type = 'model'
    else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) uploadForm.type = 'image'
    else if (['mp4', 'webm'].includes(ext)) uploadForm.type = 'video'
    else if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) uploadForm.type = 'doc'
    else if (['las', 'laz'].includes(ext)) uploadForm.type = 'pointcloud'
  }
}

async function handleUpload() {
  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }
  if (!uploadForm.type) {
    ElMessage.warning('请选择资源类型')
    return
  }
  isUploading.value = true
  uploadProgress.value = 30
  try {
    await uploadResourceFile(uploadForm.file, uploadForm.folderId, uploadForm.type, uploadForm.remark)
    uploadProgress.value = 100
    ElMessage.success('上传成功')
    uploadVisible.value = false
    await Promise.all([fetchList(1), fetchTree()])
  } catch {
    /* 请求失败已由拦截器提示 */
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

function openEdit(row: ResourceVo) {
  editForm.id = row.id
  editForm.name = row.name
  editForm.type = row.type
  editForm.remark = row.remark
  editVisible.value = true
}

async function handleEditSave() {
  if (!editForm.name.trim()) {
    ElMessage.warning('请输入资源名称')
    return
  }
  try {
    await updateResource(editForm.id, {
      name: editForm.name.trim(),
      type: editForm.type,
      remark: editForm.remark,
    })
    ElMessage.success('已保存')
    editVisible.value = false
    await Promise.all([fetchList(currentPage.value), fetchTree()])
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

function openFolderCreate(parentId = '') {
  folderForm.mode = 'create'
  folderForm.id = ''
  folderForm.parentId = parentId
  folderForm.name = ''
  folderVisible.value = true
}

function openFolderRename(node: ResourceNode) {
  folderForm.mode = 'rename'
  folderForm.id = node.id
  folderForm.name = node.name
  folderVisible.value = true
}

async function handleFolderSave() {
  const name = folderForm.name.trim()
  if (!name) {
    ElMessage.warning('请输入目录名称')
    return
  }
  try {
    if (folderForm.mode === 'create') {
      await createResource({
        name,
        type: 'folder',
        parentId: folderForm.parentId ? Number(folderForm.parentId) : 0,
      })
      ElMessage.success('已新建目录')
    } else {
      await updateResource(folderForm.id, { name })
      ElMessage.success('已重命名')
    }
    folderVisible.value = false
    await fetchTree()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleFolderDelete(node: ResourceNode) {
  try {
    await ElMessageBox.confirm(`删除目录「${node.name}」会同时删除其下资源，确定继续吗？`, '删除目录', { type: 'warning' })
    await deleteResource(node.id)
    ElMessage.success('已删除目录')
    if (currentFolderId.value === node.id) currentFolderId.value = ''
    await Promise.all([fetchTree(), fetchList(1)])
  } catch {
    /* 用户取消 */
  }
}

function openPreview(row: ResourceVo) {
  previewRow.value = row
  previewVisible.value = true
  const ext = extOf(row.name)
  if (['glb', 'gltf'].includes(ext)) ensureModelViewer()
}

function downloadRow(row: ResourceVo) {
  if (!row.fileUrl) {
    ElMessage.warning('该资源暂无可用下载地址')
    return
  }
  const anchor = document.createElement('a')
  anchor.href = row.fileUrl
  anchor.download = row.name
  anchor.target = '_blank'
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

function canPreview(row: ResourceVo) {
  return ['image', 'video', 'pdf'].includes(extOf(row.name)) && !!row.fileUrl
}

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

onMounted(() => {
  fetchTree()
  fetchList()
})
</script>

<template>
  <div class="resource-page">
    <AdminPageHeader title="资源管理" :crumbs="['首页', '业务数据', '资源管理']" />
    <p class="resource-page-desc">
      多类型资源统一入库，支持目录管理、上传、下载、在线预览、编辑、批量删除与查询统计。
    </p>

    <div class="res-layout">
      <aside class="res-tree-card">
        <div class="res-tree-header">
          <h3>资源目录</h3>
          <button type="button" class="btn btn-primary" @click="openFolderCreate()">新建根目录</button>
        </div>
        <div class="res-tree-body" v-loading="treeLoading">
          <button type="button" class="res-tree-all" :class="{ 'is-active': !currentFolderId }" @click="selectAllResources">
            全部资源
          </button>
          <el-tree
            :data="folderTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="res-tree-node-row">
                <span class="res-tree-label">{{ data.name }}</span>
                <span class="res-tree-actions" @click.stop>
                  <button v-if="node.level < 3" type="button" class="res-tree-act" title="新建子目录" @click="openFolderCreate(data.id)">+</button>
                  <button type="button" class="res-tree-act" title="重命名" @click="openFolderRename(data)">改</button>
                  <button type="button" class="res-tree-act" title="删除" @click="handleFolderDelete(data)">删</button>
                </span>
              </div>
            </template>
          </el-tree>
          <div v-if="!folderTree.length" class="res-tree-empty">暂无目录，点击上方新建</div>
        </div>
      </aside>

      <div class="res-main">
        <div class="res-stats-bar">
          <span class="res-stat-pill">资源总数 <strong>{{ stats.count }}</strong></span>
          <span class="res-stat-pill">总占用 <strong>{{ formatBytes(stats.bytes) }}</strong></span>
          <span class="res-stat-pill">当前目录条目 <strong>{{ stats.folderCount }}</strong></span>
        </div>
        <p class="res-breadcrumb">当前位置：<strong>{{ currentFolderId ? (flatFolders.find(f => f.id === currentFolderId)?.name || '—') : '全部资源' }}</strong></p>

        <div class="admin-toolbar">
          <button type="button" class="btn btn-primary" @click="openUpload">上传</button>
          <button type="button" class="btn" @click="handleBatchDelete">批量删除</button>
          <div class="toolbar-spacer"></div>
          <el-select v-model="draftType" placeholder="资源类型" clearable class="toolbar-type">
            <el-option v-for="t in RESOURCE_TYPE_OPTIONS.filter(o => o.value)" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-input
            v-model="draftKeyword"
            placeholder="名称 / 说明关键字"
            clearable
            class="toolbar-search"
            @keyup.enter="onSearch"
          />
          <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
          <button type="button" class="btn" @click="onClearFilter">重置条件</button>
        </div>

        <div class="admin-table-wrap" v-loading="loading">
          <el-table
            :data="list"
            border
            class="admin-el-table"
            row-key="id"
            empty-text="当前目录无资源或无匹配查询结果"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="44" align="center" />
            <el-table-column prop="name" label="名称" min-width="200" align="left" show-overflow-tooltip />
            <el-table-column label="资源类型" width="110" align="center">
              <template #default="{ row }">
                <span class="res-type-tag">{{ typeLabel(row.type) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="格式" width="80" align="center">
              <template #default="{ row }">{{ extOf(row.name).toUpperCase() || '—' }}</template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100" align="right" />
            <el-table-column prop="updatedAt" label="更新时间" width="120" align="center" />
            <el-table-column prop="remark" label="说明" min-width="140" align="left" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark || '—' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right" align="center">
              <template #default="{ row }">
                <div class="admin-table-actions">
                  <button type="button" class="btn btn-ghost" :disabled="!canPreview(row)" @click="openPreview(row)">浏览</button>
                  <button type="button" class="btn btn-ghost" @click="downloadRow(row)">下载</button>
                  <button type="button" class="btn btn-ghost" @click="openEdit(row)">编辑</button>
                  <button type="button" class="btn btn-danger" @click="handleDelete(row)">删除</button>
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

    <el-dialog v-model="uploadVisible" title="上传资源" width="520px" destroy-on-close>
      <el-form label-width="90px">
        <input ref="fileInputRef" type="file" class="hidden-file-input" @change="handleFileSelect" />
        <el-form-item label="目标目录">
          <el-select v-model="uploadForm.folderId" placeholder="根目录" clearable style="width: 100%">
            <el-option v-for="folder in flatFolders" :key="folder.id" :label="folder.name" :value="folder.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="uploadForm.type" placeholder="请选择" style="width: 100%">
            <el-option v-for="t in RESOURCE_TYPE_OPTIONS.filter(o => o.value)" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-button :disabled="isUploading" @click="triggerFileInput">
            {{ uploadForm.file ? uploadForm.file.name : '选择文件' }}
          </el-button>
          <span class="res-upload-hint">支持 GLB/OBJ/JPG/PDF/LAS/MP4 等格式</span>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="uploadForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item v-if="isUploading">
          <el-progress :percentage="uploadProgress" :show-text="true" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="isUploading" @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :disabled="isUploading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑资源" width="480px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option v-for="t in RESOURCE_TYPE_OPTIONS.filter(o => o.value)" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="folderVisible" :title="folderForm.mode === 'create' ? '新建目录' : '重命名目录'" width="420px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="目录名称">
          <el-input v-model="folderForm.name" placeholder="请输入目录名称" @keyup.enter="handleFolderSave" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFolderSave">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" :title="`预览 · ${previewRow?.name || ''}`" width="860px" destroy-on-close>
      <div v-if="previewRow" class="res-preview-host">
        <img v-if="previewType === 'image'" :src="previewRow.fileUrl" alt="" class="res-preview-img" />
        <video v-else-if="previewType === 'video'" :src="previewRow.fileUrl" controls playsinline class="res-preview-video"></video>
        <iframe v-else-if="previewType === 'pdf'" :src="previewRow.fileUrl" title="PDF" class="res-preview-frame"></iframe>
        <model-viewer
          v-else-if="previewType === 'model' && modelViewerReady"
          :src="previewRow.fileUrl"
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1"
          environment-image="neutral"
          class="res-preview-model"
          alt="三维模型预览"
        ></model-viewer>
        <div v-else-if="previewType === 'model'" class="res-preview-fallback">
          <p>三维模型加载中…</p>
        </div>
        <div v-else class="res-preview-fallback">
          <p><strong>{{ previewRow.name }}</strong></p>
          <p>当前格式（.{{ previewExt || '—' }}）暂无在线预览，请使用「下载」查看。</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.resource-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resource-page-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--admin-muted);
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.res-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--admin-border);

  h3 { margin: 0; font-size: 0.84rem; color: var(--admin-text); }
}

.res-tree-body {
  padding: 10px 8px;
  overflow: auto;
  flex: 1;
}

.res-tree-all {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
  color: var(--admin-text);
  cursor: pointer;

  &.is-active { background: rgba(90, 155, 138, 0.14); font-weight: 600; }
}

.res-tree-node-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding-right: 4px;
}

.res-tree-label {
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.res-tree-actions {
  display: flex;
  gap: 2px;
  opacity: 0.55;
}

.res-tree-act {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 4px;
  background: rgba(90, 155, 138, 0.12);
  color: var(--admin-text);
  font-size: 0.68rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.res-tree-empty {
  padding: 14px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--admin-muted);
}

.res-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.res-stats-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.res-stat-pill {
  font-size: 0.76rem;
  color: var(--admin-muted);
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(90, 155, 138, 0.1);

  strong { color: var(--admin-text); }
}

.res-breadcrumb {
  margin: 0;
  font-size: 0.76rem;
  color: var(--admin-muted);
}

.res-type-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(90, 155, 138, 0.12);
  color: #2f6f64;
  font-size: 0.72rem;
}

.res-upload-hint {
  margin-left: 8px;
  color: var(--admin-muted);
  font-size: 0.78rem;
}

.hidden-file-input {
  display: none;
}

.res-preview-host {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.res-preview-img {
  max-width: 100%;
  max-height: 60vh;
}

.res-preview-video {
  width: 100%;
  max-height: 60vh;
}

.res-preview-frame {
  width: 100%;
  height: 58vh;
  border: none;
}

.res-preview-model {
  width: 100%;
  height: 58vh;
}

.res-preview-fallback {
  text-align: center;
  color: var(--admin-muted);
  font-size: 0.84rem;
  line-height: 1.8;
}

@media (max-width: 1000px) {
  .res-layout { grid-template-columns: 1fr; }
}
</style>
