<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import 'pannellum'
import 'pannellum/build/pannellum.css'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getPanoramaList,
  createPanorama,
  updatePanorama,
  deletePanorama,
  uploadPanoramaFile,
  PANO_CATEGORIES,
  type PanoramaVo,
} from '@/api/panorama'
import { ElMessage, ElMessageBox } from 'element-plus'

const CATEGORY_META: Record<string, { label: string; prefix: string }> = {
  air: { label: '空中', prefix: 'mus_air' },
  ground: { label: '地面', prefix: 'mus_gnd' },
  inner: { label: '内部', prefix: 'mus_in' },
  outdoor: { label: '室外', prefix: 'mus_out' },
}

const loading = ref(false)
const all = ref<PanoramaVo[]>([])
const activeCategory = ref('air')
const activeResId = ref('')

const currentList = computed(() =>
  all.value.filter(item => item.category === activeCategory.value),
)

const previewRes = computed(
  () => currentList.value.find(item => item.id === activeResId.value) || currentList.value[0] || null,
)

const previewImage = computed(() => previewRes.value?.imageUrl || '')

const panoHostRef = ref<HTMLDivElement | null>(null)
let panoViewer: any = null

function destroyPano() {
  try {
    panoViewer?.destroy()
  } catch {
    /* 预览器已销毁 */
  }
  panoViewer = null
}

function renderPano() {
  destroyPano()
  const host = panoHostRef.value
  const url = previewImage.value
  if (!host || !url) return
  const pannellum = (window as any).pannellum
  if (!pannellum) {
    host.innerHTML = '<p class="pano-inline-tip">全景库未加载</p>'
    return
  }
  try {
    panoViewer = pannellum.viewer(host, {
      type: 'equirectangular',
      panorama: url,
      autoLoad: true,
      showControls: true,
      compass: true,
      mouseZoom: true,
      draggable: true,
      hfov: 90,
      minHfov: 40,
      maxHfov: 120,
      pitch: 0,
      yaw: 0,
    })
  } catch {
    host.innerHTML = '<p class="pano-inline-tip">全景加载失败，请检查片源</p>'
  }
}

watch(previewImage, async () => {
  await nextTick()
  renderPano()
})

function categoryCount(key: string) {
  return all.value.filter(item => item.category === key).length
}

function categoryLabel(key: string) {
  return CATEGORY_META[key]?.label || key
}

function baseName(filename: string) {
  const name = String(filename || '')
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(0, idx) : name
}

function formatSize(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value?: string) {
  if (!value) return '—'
  return String(value).slice(0, 10)
}

function resCode(row: PanoramaVo) {
  const prefix = CATEGORY_META[row.category]?.prefix || 'mus'
  return `${prefix}_${String(row.id).padStart(2, '0')}`
}

async function fetchAll() {
  loading.value = true
  try {
    const res = await getPanoramaList({ page: 1, pageSize: 1000 })
    all.value = res.items
    if (!currentList.value.some(item => item.id === activeResId.value)) {
      activeResId.value = currentList.value[0]?.id || ''
    }
  } catch {
    all.value = []
  } finally {
    loading.value = false
  }
}

watch(activeCategory, () => {
  activeResId.value = currentList.value[0]?.id || ''
})

const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleFiles(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files.length) return
  uploading.value = true
  try {
    let lastId = ''
    for (const file of files) {
      const created = await createPanorama({
        name: baseName(file.name),
        category: activeCategory.value,
        description: '',
        status: 'draft',
      })
      await uploadPanoramaFile(created.id, file)
      lastId = created.id
    }
    ElMessage.success(`已上传 ${files.length} 个全景文件`)
    await fetchAll()
    if (lastId) activeResId.value = lastId
  } catch {
    /* 请求失败已由拦截器提示 */
  } finally {
    uploading.value = false
    target.value = ''
  }
}

async function toggleStatus(row: PanoramaVo) {
  const newStatus = row.status === 'published' ? 'draft' : 'published'
  try {
    await updatePanorama(row.id, { status: newStatus })
    ElMessage.success(newStatus === 'published' ? '已上线' : '已转为草稿')
    await fetchAll()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleDelete(row: PanoramaVo) {
  try {
    await ElMessageBox.confirm(`确定删除全景资源「${row.name}」？`, '提示', { type: 'warning' })
    await deletePanorama(row.id)
    ElMessage.success('已删除')
    await fetchAll()
  } catch {
    /* 用户取消 */
  }
}

const showPreview = ref(false)
const previewTarget = ref<PanoramaVo | null>(null)

function openPreview(row: PanoramaVo) {
  if (!row.imageUrl) {
    ElMessage.warning('该资源暂无全景文件')
    return
  }
  previewTarget.value = row
  showPreview.value = true
}

function downloadRes(row: PanoramaVo) {
  if (!row.imageUrl) {
    ElMessage.warning('该资源暂无全景文件')
    return
  }
  const a = document.createElement('a')
  a.href = row.imageUrl
  a.download = row.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function jumpPreview() {
  document.querySelector('.pano-preview-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  await fetchAll()
  await nextTick()
  renderPano()
})

onBeforeUnmount(destroyPano)
</script>

<template>
  <div class="pano-page">
    <AdminPageHeader title="博物馆全景管理" :crumbs="['首页', '业务数据', '博物馆全景管理']" />

    <section class="admin-card pano-preview-card">
      <h2 class="card-title">全景配置预览（管理端）</h2>
      <p class="card-desc">
        非游客端页面：此处仅用于在后台验证「分类（空中 / 地面 / 内部 / 室外）+ 片源」的配置效果。底部为分类与资源缩略条，点击可切换预览。
      </p>

      <div class="pano-stage">
        <div v-if="previewImage" ref="panoHostRef" class="pano-viewer" aria-label="全景预览"></div>
        <div v-else class="pano-placeholder">
          <div class="pano-sky"></div>
          <span>当前分类暂无全景文件，请上传</span>
        </div>

        <div class="pano-overlay">
          <div class="pano-topbar">
            <span class="pano-brand">后台预览</span>
          </div>
          <div class="pano-bottomdock">
            <div class="pano-cats" role="tablist" aria-label="全景分类">
              <button
                v-for="cat in PANO_CATEGORIES"
                :key="cat.key"
                type="button"
                class="pano-cat"
                :class="{ 'is-active': activeCategory === cat.key }"
                @click="activeCategory = cat.key"
              >
                {{ categoryLabel(cat.key) }}（{{ categoryCount(cat.key) }}）
              </button>
            </div>
            <div class="pano-thumbs">
              <button
                v-for="item in currentList"
                :key="item.id"
                type="button"
                class="pano-thumb"
                :class="{ 'is-selected': previewRes?.id === item.id }"
                :title="item.name"
                @click="activeResId = item.id"
              >
                <span class="pano-thumb-label">{{ item.name }}</span>
              </button>
              <span v-if="!currentList.length" class="pano-thumbs-empty">当前分类暂无文件</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="admin-card">
      <h2 class="card-title">全景资源列表（后端管理）</h2>
      <p class="card-desc">
        按「空中 / 地面 / 内部 / 室外」Tab 切换维护。上传文件后，文件名（去扩展名）即为位置名称，用于下发前端视点选择信息。
      </p>

      <div class="admin-toolbar">
        <button type="button" class="btn" @click="jumpPreview">进入预览区</button>
      </div>

      <div class="res-tabs" role="tablist" aria-label="全景资源分类">
        <button
          v-for="cat in PANO_CATEGORIES"
          :key="cat.key"
          type="button"
          class="res-tab"
          :class="{ 'is-active': activeCategory === cat.key }"
          :aria-selected="activeCategory === cat.key"
          @click="activeCategory = cat.key"
        >
          {{ categoryLabel(cat.key) }}
        </button>
      </div>

      <div class="res-head">
        <h3>{{ categoryLabel(activeCategory) }}全景</h3>
        <div class="res-head-actions">
          <button type="button" class="btn btn-primary" :disabled="uploading" @click="triggerUpload">
            {{ uploading ? '上传中…' : '上传当前分类全景' }}
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            hidden
            @change="handleFiles"
          />
        </div>
      </div>

      <div class="admin-table-wrap" v-loading="loading">
        <el-table :data="currentList" border class="admin-el-table" row-key="id" empty-text="暂无资源，请上传全景文件。">
          <el-table-column label="位置名称（文件名）" min-width="200" show-overflow-tooltip align="left">
            <template #default="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="资源 ID" width="150" align="center">
            <template #default="{ row }">{{ resCode(row) }}</template>
          </el-table-column>
          <el-table-column label="大小" width="110" align="center">
            <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column label="上传时间" width="130" align="center">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', row.status === 'published' ? 'action-success' : 'action-warning']">
                {{ row.status === 'published' ? '已上线' : '草稿' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="290" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="openPreview(row)">预览</button>
                <button type="button" class="btn" @click="downloadRes(row)">下载</button>
                <button type="button" class="btn" @click="toggleStatus(row)">
                  {{ row.status === 'published' ? '下线' : '上线' }}
                </button>
                <button type="button" class="btn btn-danger" @click="handleDelete(row)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-dialog v-model="showPreview" :title="previewTarget?.name || '全景预览'" width="880px" destroy-on-close>
      <img v-if="previewTarget?.imageUrl" :src="previewTarget.imageUrl" class="preview-dialog-image" alt="全景预览" />
      <template #footer>
        <el-button @click="showPreview = false">关闭</el-button>
        <el-button v-if="previewTarget?.imageUrl" type="primary" @click="downloadRes(previewTarget)">下载</el-button>
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

.card-title {
  margin: 16px 16px 6px;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--admin-text);
}

.card-desc {
  margin: 0 16px 14px;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.6;
}

.pano-stage {
  position: relative;
  margin: 0 16px 16px;
  height: 340px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, #0ea5e9 0%, #38bdf8 45%, #86efac 75%, #4ade80 100%);
}

.pano-viewer {
  width: 100%;
  height: 100%;

  :deep(.pano-inline-tip) {
    margin: 0;
    padding: 24px;
    text-align: center;
    color: #fff;
  }
}

.pano-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  text-shadow: 0 1px 3px rgba(15, 23, 42, 0.5);

  .pano-sky {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 24%, rgba(255, 255, 255, 0.55) 0 42px, transparent 43px),
      radial-gradient(circle at 55% 20%, rgba(255, 255, 255, 0.45) 0 32px, transparent 33px),
      radial-gradient(circle at 78% 28%, rgba(255, 255, 255, 0.5) 0 38px, transparent 39px);
    pointer-events: none;
  }
}

.pano-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.pano-topbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
}

.pano-brand {
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.55);
  color: #e2e8f0;
  font-size: 0.78rem;
}

.pano-bottomdock {
  padding: 10px 12px 12px;
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.55));
  pointer-events: auto;
}

.pano-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.pano-cat {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.35);
  background: rgba(15, 23, 42, 0.45);
  color: #e2e8f0;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;

  &.is-active {
    background: rgba(59, 130, 246, 0.85);
    border-color: rgba(147, 197, 253, 0.9);
    color: #fff;
  }
}

.pano-thumbs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.pano-thumb {
  flex: 0 0 auto;
  max-width: 180px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.3);
  background: rgba(15, 23, 42, 0.4);
  color: #e2e8f0;
  font-size: 0.78rem;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: inherit;

  &.is-selected {
    border-color: #fbbf24;
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.35);
  }
}

.pano-thumbs-empty {
  color: rgba(226, 232, 240, 0.8);
  font-size: 0.78rem;
  padding: 4px 6px;
}

.admin-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 0 16px 10px;
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

  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
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

.res-tabs {
  display: flex;
  gap: 6px;
  padding: 0 16px 10px;
}

.res-tab {
  padding: 7px 18px;
  border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: #fff;
  color: var(--admin-text);
  font-size: 0.86rem;
  cursor: pointer;
  font-family: inherit;

  &.is-active {
    background: var(--admin-primary);
    border-color: var(--admin-primary);
    color: #fff;
  }
}

.res-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px 10px;
  border-bottom: 1px solid var(--admin-border);

  h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--admin-text);
  }
}

.res-head-actions {
  display: flex;
  gap: 10px;
}

.admin-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 10px;
}

.admin-table-wrap :deep(.admin-el-table) {
  --el-table-border-color: var(--admin-border);
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f1f5f9;
}

.preview-dialog-image {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  display: block;
}

@media (max-width: 768px) {
  .pano-stage {
    height: 240px;
  }
}
</style>
