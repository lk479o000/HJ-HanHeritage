<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getCoffinList,
  getCoffinDetail,
  createCoffin,
  updateCoffin,
  deleteCoffin,
  COFFIN_REGISTRY_FIELDS,
  EDIT_SECTIONS,
  type CoffinVo,
  type CoffinQuery,
} from '@/api/coffin'
import { uploadResourceFile } from '@/api/resource'
import { ElImageViewer, ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

const loading = ref(false)
const list = ref<CoffinVo[]>([])
const total = ref(0)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const currentPage = ref(1)
const currentPageSize = ref(10)
const viewMode = ref<'card' | 'table'>('card')

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

const imagePreviewVisible = ref(false)
const imagePreviewUrls = ref<string[]>([])
const imagePreviewIndex = ref(0)

function openImagePreview(urls: (string | undefined)[], index = 0) {
  const list = urls.filter((url): url is string => !!url)
  if (!list.length) return
  imagePreviewUrls.value = list
  imagePreviewIndex.value = index
  imagePreviewVisible.value = true
}

const viewModelUrl = computed(() => viewItem.value?.models?.[0]?.modelUrl || '')
const modelViewerReady = ref(false)

async function ensureModelViewer() {
  if (modelViewerReady.value) return
  try {
    await import('@google/model-viewer')
    modelViewerReady.value = true
  } catch {
    /* 本地依赖不可用时保留占位提示 */
  }
}

async function viewCoffin(c: CoffinVo) {
  try {
    const detail = await getCoffinDetail(c.id)
    viewItem.value = detail
    showView.value = true
  } catch {
    viewItem.value = c
    showView.value = true
  }
  if (viewModelUrl.value) ensureModelViewer()
}

const showEdit = ref(false)
const editItem = ref<CoffinVo | null>(null)
const formRef = ref<FormInstance>()
const isCreating = ref(false)

function defaultCoffin(): CoffinVo {
  return {
    id: '',
    title: '',
    originalName: '',
    registryType: '石棺',
    collectionId: '',
    code: '',
    tombGroup: '',
    eraCategory: '历史年代',
    dynasty: '东汉',
    eraSpecific: '',
    artifactCategory: '石刻',
    textureType: '石',
    materialCategory: '',
    materialSpecific: '',
    quantity: 1,
    dimLength: '',
    dimWidth: '',
    dimHeight: '',
    dimText: '',
    weightRange: '',
    weightValue: '',
    weightUnit: 'kg',
    relicGrade: '未定级',
    completeness: '',
    completenessDetail: '',
    preservationStatus: '',
    sourceType: '',
    sourceDetail: '',
    accessionRange: '',
    accessionYear: '',
    images: [],
    models: [],
  }
}

function addCoffin() {
  isCreating.value = true
  editItem.value = defaultCoffin()
  showEdit.value = true
}

function editCoffin(c: CoffinVo) {
  isCreating.value = false
  editItem.value = {
    ...c,
    images: (c.images || []).map(img => ({ ...img })),
    models: (c.models || []).map(model => ({ ...model })),
  }
  showEdit.value = true
}

function formatSize(bytes?: number) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

const imageUploading = ref(false)
const modelUploading = ref(false)

async function uploadCoffinImage(file: any) {
  const raw: File | undefined = file?.raw
  if (!raw || !editItem.value) return
  if (!raw.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  imageUploading.value = true
  try {
    const res = await uploadResourceFile(raw, 'coffin-images', 'image')
    const url = res?.fileUrl || ''
    if (!url) {
      ElMessage.error('上传返回地址为空')
      return
    }
    const images = editItem.value.images ? [...editItem.value.images] : []
    images.push({ imageUrl: url, imageType: 'photo', sort: images.length })
    editItem.value.images = images
    ElMessage.success('图片已上传，保存后生效')
  } catch {
    ElMessage.error('图片上传失败')
  } finally {
    imageUploading.value = false
  }
}

function moveCoffinImage(index: number, delta: number) {
  const images = editItem.value?.images ? [...editItem.value.images] : []
  const target = index + delta
  if (target < 0 || target >= images.length) return
  const [item] = images.splice(index, 1)
  images.splice(target, 0, item)
  editItem.value!.images = images.map((img, i) => ({ ...img, sort: i }))
}

function removeCoffinImage(index: number) {
  const images = editItem.value?.images ? [...editItem.value.images] : []
  images.splice(index, 1)
  editItem.value!.images = images.map((img, i) => ({ ...img, sort: i }))
}

async function uploadCoffinModel(file: any) {
  const raw: File | undefined = file?.raw
  if (!raw || !editItem.value) return
  const suffix = raw.name.split('.').pop()?.toLowerCase() || ''
  if (suffix !== 'glb' && suffix !== 'gltf') {
    ElMessage.warning('请选择 .glb 或 .gltf 模型文件')
    return
  }
  modelUploading.value = true
  try {
    const res = await uploadResourceFile(raw, 'coffin-models', 'model')
    const url = res?.fileUrl || ''
    if (!url) {
      ElMessage.error('上传返回地址为空')
      return
    }
    const models = editItem.value.models ? [...editItem.value.models] : []
    models.push({ modelUrl: url, format: suffix, fileSize: raw.size })
    editItem.value.models = models
    ElMessage.success('模型已上传，保存后生效')
  } catch {
    ElMessage.error('模型上传失败')
  } finally {
    modelUploading.value = false
  }
}

function removeCoffinModel(index: number) {
  const models = editItem.value?.models ? [...editItem.value.models] : []
  models.splice(index, 1)
  editItem.value!.models = models
}

async function saveCoffin() {
  if (!editItem.value) return
  if (!editItem.value.title?.trim()) {
    ElMessage.warning('请输入石棺名称')
    return
  }
  try {
    const payload = { ...editItem.value }
    if (isCreating.value) {
      payload.collectionId = payload.collectionId?.trim() || `HJ-SG-${Date.now().toString().slice(-6)}`
      payload.code = payload.collectionId
      await createCoffin(payload)
      ElMessage.success('新增成功')
    } else {
      await updateCoffin(payload.id, payload)
      ElMessage.success('保存成功')
    }
    showEdit.value = false
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function exportCoffins() {
  try {
    const res = await getCoffinList({ page: 1, pageSize: 1000, keyword: appliedKeyword.value.trim() || undefined })
    const headers = ['藏品编号', '名称', '所属崖墓群', '年代', '质地', '文物级别', '完残程度', '保存状态', '来源', '入藏年度']
    const rows = res.items.map(item => [
      item.collectionId,
      item.title,
      item.tombGroup || '',
      item.dynasty || '',
      item.textureType || '',
      item.relicGrade || '',
      item.completeness || '',
      item.preservationStatus || '',
      item.sourceType || '',
      item.accessionYear || '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `石棺台账_${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('导出失败')
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
          placeholder="模糊查询：名称、编号、崖墓群、朝代、年代、质地、级别、来源、完残、简介…"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <button type="button" class="btn" @click="addCoffin">新增石棺</button>
        <button type="button" class="btn" @click="exportCoffins">导出</button>
        <div class="view-toggle" role="group" aria-label="视图切换">
          <button type="button" :class="{ 'is-active': viewMode === 'card' }" @click="viewMode = 'card'">卡片</button>
          <button type="button" :class="{ 'is-active': viewMode === 'table' }" @click="viewMode = 'table'">表格</button>
        </div>
      </div>

      <div v-if="viewMode === 'card'" class="coffin-grid" v-loading="loading">
        <article v-for="row in list" :key="row.id" class="coffin-card">
          <div class="coffin-card-thumb-wrap">
            <img
              v-if="row.coverUrl"
              :src="row.coverUrl"
              class="coffin-card-thumb"
              loading="lazy"
              alt="石棺封面"
              title="点击放大"
              @click="openImagePreview([row.coverUrl])"
            />
            <div v-else class="coffin-card-thumb coffin-card-thumb--ph">暂无封面</div>
          </div>
          <div class="coffin-card-body">
            <div class="coffin-card-code">{{ row.collectionId || '—' }}</div>
            <div class="coffin-card-title" :title="row.title">{{ row.title }}</div>
            <div class="coffin-card-tags">
              <span v-if="row.tombGroup" class="coffin-card-tag">{{ row.tombGroup }}</span>
              <span v-if="row.dynasty" class="coffin-card-tag">{{ row.dynasty }}</span>
              <span v-if="row.textureType" class="coffin-card-tag">{{ row.textureType }}</span>
              <span :class="['action-tag', relicGradeClass(row.relicGrade)]">{{ row.relicGrade || '未定级' }}</span>
            </div>
            <div class="coffin-card-actions">
              <button type="button" class="btn btn-primary" @click="viewCoffin(row)">查看</button>
              <button type="button" class="btn" @click="editCoffin(row)">编辑</button>
              <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
            </div>
          </div>
        </article>
        <p v-if="!loading && !list.length" class="coffin-grid-empty">无匹配记录</p>
      </div>

      <div v-else class="admin-table-wrap" v-loading="loading">
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
          <el-table-column label="封面" width="84" align="center">
            <template #default="{ row }">
              <img
                v-if="row.coverUrl"
                :src="row.coverUrl"
                class="table-cover"
                loading="lazy"
                alt="石棺封面"
                title="点击放大"
                @click="openImagePreview([row.coverUrl])"
              />
              <span v-else class="table-cover-ph">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="名称" min-width="180" show-overflow-tooltip align="left" />
          <el-table-column prop="collectionId" label="藏品编号" width="150" align="left" />
          <el-table-column prop="tombGroup" label="所属崖墓群" min-width="160" show-overflow-tooltip align="left">
            <template #default="{ row }">{{ row.tombGroup || '—' }}</template>
          </el-table-column>
          <el-table-column prop="dynasty" label="朝代" width="90" align="center" />
          <el-table-column prop="textureType" label="质地" width="90" align="center" />
          <el-table-column prop="relicGrade" label="文物级别" width="110" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', relicGradeClass(row.relicGrade)]">{{ row.relicGrade }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="completeness" label="完残程度" width="110" align="center" />
          <el-table-column prop="viewCount" label="浏览量" width="90" align="center" />
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
          <model-viewer
            v-if="viewModelUrl && modelViewerReady"
            :src="viewModelUrl"
            class="coffin-view-model"
            camera-controls
            touch-action="pan-y"
            shadow-intensity="1"
            environment-image="neutral"
            alt="石棺三维模型"
          ></model-viewer>
          <div v-else-if="viewModelUrl" class="model-placeholder">
            <p>三维模型加载中…</p>
          </div>
          <div v-else class="model-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <p>该石棺暂无三维模型</p>
          </div>
        </div>
        <div v-if="viewItem.images?.length" class="coffin-view__images">
          <img
            v-for="(img, i) in viewItem.images"
            :key="img.id || img.imageUrl"
            :src="img.imageUrl"
            class="coffin-view-img"
            alt="石棺成果图"
            title="点击放大"
            @click="openImagePreview((viewItem.images || []).map(item => item.imageUrl), i)"
          />
        </div>
        <div class="coffin-view__fields">
          <div v-for="f in COFFIN_REGISTRY_FIELDS" :key="f.key" class="cv-field">
            <span class="cv-label">{{ f.label }}</span>
            <span class="cv-value">{{ viewItem[f.key] || '—' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showEdit" :title="isCreating ? '新增石棺' : '编辑石棺'" width="760px" destroy-on-close>
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

        <div class="ce-section">
          <h4>石棺成果图（顺序即游客端展示顺序）</h4>
          <div v-if="editItem.images?.length" class="coffin-media-list">
            <div v-for="(img, i) in editItem.images" :key="img.id || img.imageUrl" class="coffin-media-item">
              <img
                :src="img.imageUrl"
                class="coffin-media-thumb"
                alt="石棺成果图"
                title="点击放大"
                @click="openImagePreview((editItem.images || []).map(item => item.imageUrl), i)"
              />
              <span class="coffin-media-url" :title="img.imageUrl">{{ img.imageUrl }}</span>
              <button type="button" class="btn" :disabled="i === 0" @click="moveCoffinImage(i, -1)">上移</button>
              <button type="button" class="btn" :disabled="i === (editItem.images?.length || 0) - 1" @click="moveCoffinImage(i, 1)">下移</button>
              <button type="button" class="btn btn-danger" @click="removeCoffinImage(i)">移除</button>
            </div>
          </div>
          <p v-else class="coffin-media-empty">暂无成果图，游客端将使用兜底图或空态</p>
          <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="uploadCoffinImage">
            <button type="button" class="btn" :disabled="imageUploading">
              {{ imageUploading ? '上传中…' : '上传成果图' }}
            </button>
          </el-upload>
        </div>

        <div class="ce-section">
          <h4>石棺三维模型</h4>
          <div v-if="editItem.models?.length" class="coffin-media-list">
            <div v-for="(model, i) in editItem.models" :key="model.id || model.modelUrl" class="coffin-media-item">
              <span class="coffin-media-url" :title="model.modelUrl">{{ model.modelUrl }}</span>
              <span class="coffin-media-meta">{{ model.format || 'glb' }} · {{ formatSize(model.fileSize) }}</span>
              <button type="button" class="btn btn-danger" @click="removeCoffinModel(i)">移除</button>
            </div>
          </div>
          <p v-else class="coffin-media-empty">暂无模型，游客端显示「模型待补充」</p>
          <el-upload :auto-upload="false" :show-file-list="false" accept=".glb,.gltf" :on-change="uploadCoffinModel">
            <button type="button" class="btn" :disabled="modelUploading">
              {{ modelUploading ? '上传中…' : '上传模型（.glb/.gltf）' }}
            </button>
          </el-upload>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveCoffin">保存</el-button>
      </template>
    </el-dialog>

    <ElImageViewer
      v-if="imagePreviewVisible"
      :url-list="imagePreviewUrls"
      :initial-index="imagePreviewIndex"
      hide-on-click-modal
      @close="imagePreviewVisible = false"
    />
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

.view-toggle {
  display: inline-flex;
  margin-left: auto;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  overflow: hidden;

  button {
    min-height: 36px;
    padding: 0 14px;
    border: 0;
    background: #fff;
    color: var(--admin-text);
    font-size: 0.86rem;
    cursor: pointer;
    font-family: inherit;

    & + button {
      border-left: 1px solid var(--admin-border);
    }

    &.is-active {
      background: var(--admin-primary);
      color: #fff;
    }
  }
}

.coffin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  padding: 16px;
  min-height: 120px;
}

.coffin-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  }
}

.coffin-card-thumb-wrap {
  aspect-ratio: 4 / 3;
  background: #f1f5f9;
}

.coffin-card-thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.coffin-card-thumb--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.82rem;
  letter-spacing: 1px;
}

.coffin-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
}

.coffin-card-code {
  font-size: 0.78rem;
  color: #64748b;
}

.coffin-card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--admin-text);
}

.coffin-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.coffin-card-tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.78rem;
}

.coffin-card-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;

  .btn {
    flex: 1;
    min-height: 32px;
    padding: 0 8px;
    font-size: 0.82rem;
  }
}

.coffin-grid-empty {
  grid-column: 1 / -1;
  margin: 24px 0;
  text-align: center;
  color: var(--admin-muted);
  font-size: 0.86rem;
}

.table-cover {
  display: block;
  width: 56px;
  height: 40px;
  margin: 0 auto;
  border-radius: 4px;
  object-fit: cover;
  cursor: zoom-in;
}

.table-cover-ph {
  color: #94a3b8;
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

  .coffin-view-model {
    width: 100%;
    height: 100%;
    border-radius: 10px;
  }

  .model-placeholder {
    text-align: center;
    color: #64748b;

    p { margin: 8px 0 0; font-size: 0.88rem; }
  }

  .coffin-view__images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .coffin-view-img {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 8px;
    object-fit: cover;
    cursor: zoom-in;
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

.coffin-media-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.coffin-media-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: #fafbfc;

  .btn {
    min-height: 30px;
    padding: 0 10px;
    font-size: 0.82rem;
  }
}

.coffin-media-thumb {
  width: 64px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: zoom-in;
}

.coffin-media-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--admin-text);
}

.coffin-media-meta {
  font-size: 0.78rem;
  color: var(--admin-muted);
  white-space: nowrap;
}

.coffin-media-empty {
  margin: 0 0 10px;
  font-size: 0.82rem;
  color: var(--admin-muted);
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
