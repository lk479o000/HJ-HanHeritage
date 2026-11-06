<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getCliffList,
  getCliffDetail,
  createCliff,
  updateCliff,
  deleteCliff,
  getEntrances,
  createEntrance,
  updateEntrance,
  deleteEntrance,
  LEVEL_OPTIONS,
  CATEGORY_OPTIONS,
  TOWN_OPTIONS,
  MAP_MARKERS_13,
  checkCliffModelUrl,
  type CliffVo,
  type CliffImageVo,
  type CliffQuery,
  type EntranceVo,
} from '@/api/cliff'
import { uploadResourceFile } from '@/api/resource'
import { ElImageViewer, ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('overview')

const loading = ref(false)
const cliffList = ref<CliffVo[]>([])
const cliffTotal = ref(0)
const cliffCurrentPage = ref(1)
const cliffPageSize = ref(10)

const draftKeyword = ref('')
const draftLevel = ref('')
const draftTown = ref('')
const draftStatus = ref('')
const appliedKeyword = ref('')
const appliedLevel = ref('')
const appliedTown = ref('')
const appliedStatus = ref('')

function buildCliffQuery(page = cliffCurrentPage.value, overrides: Partial<CliffQuery> = {}): CliffQuery {
  return {
    page,
    pageSize: cliffPageSize.value,
    keyword: appliedKeyword.value.trim() || undefined,
    level: appliedLevel.value || undefined,
    town: appliedTown.value || undefined,
    status: appliedStatus.value || undefined,
    ...overrides,
  }
}

async function fetchCliffList(page = cliffCurrentPage.value) {
  loading.value = true
  try {
    const res = await getCliffList(buildCliffQuery(page))
    cliffList.value = res.items
    cliffTotal.value = res.total
    cliffCurrentPage.value = res.page
  } catch {
    cliffList.value = []
    cliffTotal.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  appliedKeyword.value = draftKeyword.value
  appliedLevel.value = draftLevel.value
  appliedTown.value = draftTown.value
  appliedStatus.value = draftStatus.value
  cliffCurrentPage.value = 1
  fetchCliffList(1)
}

function onReset() {
  draftKeyword.value = ''
  draftLevel.value = ''
  draftTown.value = ''
  draftStatus.value = ''
  appliedKeyword.value = ''
  appliedLevel.value = ''
  appliedTown.value = ''
  appliedStatus.value = ''
  cliffCurrentPage.value = 1
  fetchCliffList(1)
}

async function exportCliffs() {
  try {
    const res = await getCliffList(buildCliffQuery(1, { pageSize: 1000 }))
    const headers = ['编号', '名称', '地址', '坐标', '面积', '级别', '文物保护单位名称', '年代', '类别', '文物构成', '简介', '状态']
    const rows = res.items.map(item => [
      item.code || '',
      item.name,
      item.town ? `${item.town} ${item.address || ''}` : item.address || '',
      item.lng && item.lat ? `${item.lng},${item.lat}` : '',
      item.area || '',
      item.level || '',
      item.protectionUnitName || '',
      item.era || '',
      item.category || '',
      item.composition || '',
      (item.intro || '').replace(/<[^>]+>/g, ''),
      item.status === 'disabled' ? '禁用' : '启用',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `崖墓群台账_${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('导出失败')
  }
}

function handleCliffSizeChange(size: number) {
  cliffPageSize.value = size
  const wasPageOne = cliffCurrentPage.value === 1
  cliffCurrentPage.value = 1
  if (wasPageOne) fetchCliffList(1)
}

const showDetail = ref(false)
const detailLoading = ref(false)
const selectedCliff = ref<CliffVo | null>(null)

async function viewCliff(c: CliffVo) {
  detailLoading.value = true
  showDetail.value = true
  try {
    const res = await getCliffDetail(c.id)
    selectedCliff.value = res
  } catch {
    selectedCliff.value = c
  } finally {
    detailLoading.value = false
  }
}

const imagePreviewVisible = ref(false)
const imagePreviewUrls = ref<string[]>([])
const imagePreviewIndex = ref(0)

function openImagePreview(urls: string[], index = 0) {
  if (!urls.length) return
  imagePreviewUrls.value = urls
  imagePreviewIndex.value = index
  imagePreviewVisible.value = true
}

function resolveDetailImageIndex(url?: string): number {
  const urls = [selectedCliff.value?.coverImage, ...(selectedCliff.value?.images || []).map(img => img.imageUrl)]
    .filter((item): item is string => !!item)
  if (!urls.length) return -1
  return url ? Math.max(0, urls.indexOf(url)) : 0
}

function detailImageUrls(): string[] {
  return [selectedCliff.value?.coverImage, ...(selectedCliff.value?.images || []).map(img => img.imageUrl)]
    .filter((item): item is string => !!item)
}

function openDetailImage(url?: string) {
  const urls = detailImageUrls()
  if (urls.length) openImagePreview(urls, resolveDetailImageIndex(url))
}

function openEditImage(url?: string) {
  const urls = [newCliff.value.coverImage, ...(newCliff.value.images || []).map(img => img.imageUrl)]
    .filter((item): item is string => !!item)
  if (!urls.length) return
  openImagePreview(urls, url ? Math.max(0, urls.indexOf(url)) : 0)
}

const modelViewerReady = ref(false)
const editModelUrl = computed(() => (newCliff.value.modelUrl || '').trim())

async function ensureModelViewer() {
  if (modelViewerReady.value) return
  try {
    await import('@google/model-viewer')
    modelViewerReady.value = true
  } catch {
    /* 本地依赖不可用时保留提示 */
  }
}

const showCliffDialog = ref(false)
const cliffDialogLoading = ref(false)
const isEditingCliff = ref(false)
const editingCliffId = ref('')
const newCliff = ref<Partial<CliffVo>>({ name: '', town: '', status: 'enabled' })

watch([showCliffDialog, editModelUrl], ([open, url]) => {
  if (open && url) ensureModelViewer()
})

function resetCliffForm() {
  newCliff.value = {
    code: '',
    name: '',
    town: '',
    address: '',
    lng: '',
    lat: '',
    area: '',
    level: '',
    era: '',
    category: '',
    protectionUnitName: '',
    composition: '',
    intro: '',
    coverImage: '',
    modelUrl: '',
    mapLeft: '',
    mapTop: '',
    featured: false,
    images: [],
    status: 'enabled',
  }
}

function openAddCliff() {
  isEditingCliff.value = false
  editingCliffId.value = ''
  resetCliffForm()
  showCliffDialog.value = true
}

function openEditCliff(row: CliffVo) {
  isEditingCliff.value = true
  editingCliffId.value = row.id
  newCliff.value = {
    ...row,
    images: row.images ? row.images.map(img => ({ ...img })) : [],
  }
  showCliffDialog.value = true
}

const coverUploading = ref(false)
const galleryUploading = ref(false)

async function uploadCliffImage(file: any, target: 'cover' | 'gallery') {
  const raw: File | undefined = file?.raw
  if (!raw) return
  if (target === 'cover') coverUploading.value = true
  else galleryUploading.value = true
  try {
    const res: any = await uploadResourceFile(raw, 'cliff-images', 'image')
    const url = res?.fileUrl || res?.url || ''
    if (!url) {
      ElMessage.error('上传返回地址为空')
      return
    }
    if (target === 'cover') {
      newCliff.value.coverImage = url
    } else {
      const list = newCliff.value.images ? [...newCliff.value.images] : []
      list.push({ imageUrl: url, imageType: 'photo', sort: list.length })
      newCliff.value.images = list
    }
  } catch {
    ElMessage.error(target === 'cover' ? '封面上传失败' : '图片上传失败')
  } finally {
    coverUploading.value = false
    galleryUploading.value = false
  }
}

function removeCoverImage() {
  newCliff.value.coverImage = ''
}

function onCoverSelect(file: any) {
  uploadCliffImage(file, 'cover')
}

function onGallerySelect(file: any) {
  uploadCliffImage(file, 'gallery')
}

function removeGalleryImage(index: number) {
  const list = newCliff.value.images ? [...newCliff.value.images] : []
  list.splice(index, 1)
  newCliff.value.images = list
}

const modelChecking = ref(false)

async function checkModel() {
  const url = newCliff.value.modelUrl?.trim()
  if (!url) {
    ElMessage.info('未填写模型地址，游客端将显示“三维模型待补充”空态')
    return
  }
  modelChecking.value = true
  try {
    const result = await checkCliffModelUrl(url)
    if (result.reachable) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    ElMessage.error('模型地址校验失败')
  } finally {
    modelChecking.value = false
  }
}

async function saveCliff() {
  if (!newCliff.value.name?.trim()) {
    ElMessage.warning('请输入崖墓群名称')
    return
  }
  cliffDialogLoading.value = true
  try {
    if (isEditingCliff.value) {
      await updateCliff(editingCliffId.value, newCliff.value)
      ElMessage.success('保存成功')
    } else {
      await createCliff(newCliff.value)
      ElMessage.success('新增成功')
    }
    showCliffDialog.value = false
    await fetchCliffList()
  } catch {
    /* error handled by interceptor */
  } finally {
    cliffDialogLoading.value = false
  }
}

async function toggleCliffStatus(row: CliffVo) {
  try {
    await updateCliff(row.id, { status: row.status === 'disabled' ? 'enabled' : 'disabled' })
    ElMessage.success(row.status === 'disabled' ? '已启用' : '已禁用')
    await fetchCliffList()
  } catch {
    /* error handled by interceptor */
  }
}

async function removeCliff(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该崖墓群？', '提示', { type: 'warning' })
    await deleteCliff(id)
    ElMessage.success('已删除')
    if (cliffList.value.length === 1 && cliffCurrentPage.value > 1) {
      await fetchCliffList(cliffCurrentPage.value - 1)
    } else {
      await fetchCliffList()
    }
  } catch {
    /* user cancelled */
  }
}

const entranceLoading = ref(false)
const entranceList = ref<EntranceVo[]>([])
const entranceTotal = ref(0)
const entranceCurrentPage = ref(1)
const entrancePageSize = ref(10)
const bigEarCliffId = ref('')

async function resolveBigEarCliff() {
  try {
    const res = await getCliffList({ page: 1, pageSize: 100, keyword: '大耳朵' })
    const hit = res.items.find(item => item.name.includes('大耳朵')) || res.items[0]
    bigEarCliffId.value = hit ? hit.id : ''
  } catch {
    bigEarCliffId.value = ''
  }
}

async function fetchEntranceList(page = entranceCurrentPage.value) {
  if (!bigEarCliffId.value) {
    entranceList.value = []
    entranceTotal.value = 0
    return
  }
  entranceLoading.value = true
  try {
    const res = await getEntrances({ page, pageSize: entrancePageSize.value, cliffId: bigEarCliffId.value })
    entranceList.value = res.items
    entranceTotal.value = res.total
    entranceCurrentPage.value = res.page
  } catch {
    entranceList.value = []
    entranceTotal.value = 0
  } finally {
    entranceLoading.value = false
  }
}

function handleEntranceSizeChange(size: number) {
  entrancePageSize.value = size
  const wasPageOne = entranceCurrentPage.value === 1
  entranceCurrentPage.value = 1
  if (wasPageOne) fetchEntranceList(1)
}

const showAddEntrance = ref(false)
const addEntranceLoading = ref(false)
const newEntrance = ref<EntranceVo>({ id: '', x: 0, y: 0, z: 0, direction: '', intro: '' })

function openAddEntrance() {
  if (!bigEarCliffId.value) {
    ElMessage.warning('未找到大耳朵崖墓群，无法新增墓口')
    return
  }
  newEntrance.value = { id: '', x: 0, y: 0, z: 0, direction: '', intro: '' }
  showAddEntrance.value = true
}

async function addEntrance() {
  if (!newEntrance.value.direction?.trim()) {
    ElMessage.warning('请输入朝向/编号，如 M1')
    return
  }
  if (!bigEarCliffId.value) {
    ElMessage.warning('未找到大耳朵崖墓群，无法新增墓口')
    return
  }
  addEntranceLoading.value = true
  try {
    await createEntrance(bigEarCliffId.value, {
      x: newEntrance.value.x ?? 0,
      y: newEntrance.value.y ?? 0,
      z: newEntrance.value.z ?? 0,
      direction: newEntrance.value.direction,
      intro: newEntrance.value.intro,
    })
    ElMessage.success('新增成功')
    showAddEntrance.value = false
    await fetchEntranceList()
  } catch {
    /* error handled by interceptor */
  } finally {
    addEntranceLoading.value = false
  }
}

const showEditEntrance = ref(false)
const editEntranceLoading = ref(false)
const editingEntrance = ref<EntranceVo | null>(null)

function openEditEntrance(e: EntranceVo) {
  editingEntrance.value = { ...e, x: e.x ?? 0, y: e.y ?? 0, z: e.z ?? 0 }
  showEditEntrance.value = true
}

async function saveEntrance() {
  if (!editingEntrance.value) return
  if (!editingEntrance.value.direction?.trim()) {
    ElMessage.warning('请输入朝向/编号，如 M1')
    return
  }
  editEntranceLoading.value = true
  try {
    await updateEntrance(editingEntrance.value.id, {
      x: editingEntrance.value.x ?? 0,
      y: editingEntrance.value.y ?? 0,
      z: editingEntrance.value.z ?? 0,
      direction: editingEntrance.value.direction,
      intro: editingEntrance.value.intro,
    })
    ElMessage.success('保存成功')
    showEditEntrance.value = false
    await fetchEntranceList()
  } catch {
    /* error handled by interceptor */
  } finally {
    editEntranceLoading.value = false
  }
}

async function removeEntrance(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该墓口？', '提示', { type: 'warning' })
    await deleteEntrance(id, bigEarCliffId.value || undefined)
    ElMessage.success('已删除')
    if (entranceList.value.length === 1 && entranceCurrentPage.value > 1) {
      await fetchEntranceList(entranceCurrentPage.value - 1)
    } else {
      await fetchEntranceList()
    }
  } catch {
    /* user cancelled */
  }
}

const mapMarkers = MAP_MARKERS_13

watch(cliffCurrentPage, (page, prev) => {
  if (page !== prev) fetchCliffList(page)
})

watch(entranceCurrentPage, (page, prev) => {
  if (page !== prev) fetchEntranceList(page)
})

onMounted(async () => {
  fetchCliffList()
  await resolveBigEarCliff()
  fetchEntranceList()
})
</script>

<template>
  <div class="cliff-page">
    <AdminPageHeader title="崖墓管理" :crumbs="['首页', '业务数据', '崖墓管理']" />
    <el-tabs v-model="activeTab" class="cliff-tabs">
      <el-tab-pane label="展示查询" name="overview">
        <div class="cliff-overview">
          <div class="admin-card">
            <div class="cliff-map">
              <div class="map-container">
                <img class="map-image" src="/prototype/assets/hejiang-han-cliff-distribution.png" alt="合江县汉代崖墓分布图" />
                <div
                  v-for="m in mapMarkers"
                  :key="m.id"
                  class="map-marker"
                  :class="{ featured: (m as any).featured }"
                  :style="{ left: m.left + '%', top: m.top + '%' }"
                >
                  <span class="marker-dot"></span>
                  <span class="marker-label">{{ m.id }}</span>
                </div>
              </div>
              <p class="map-caption">点击图上标点打开崖墓信息；「编辑」可维护字段。全库共 <strong>{{ cliffTotal }}</strong> 处崖墓群。</p>
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-toolbar">
              <el-input
                v-model="draftKeyword"
                placeholder="搜索崖墓群名称/乡镇"
                clearable
                class="toolbar-search"
                @keyup.enter="onSearch"
              />
              <el-select v-model="draftLevel" placeholder="保护级别" clearable size="default" style="width: 200px">
                <el-option v-for="l in LEVEL_OPTIONS" :key="l" :label="l" :value="l" />
              </el-select>
              <el-select v-model="draftTown" placeholder="所属乡镇" clearable size="default" style="width: 160px">
                <el-option v-for="t in TOWN_OPTIONS" :key="t" :label="t" :value="t" />
              </el-select>
              <el-select v-model="draftStatus" placeholder="全部状态" clearable size="default" style="width: 130px">
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
              </el-select>
              <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
              <button type="button" class="btn" @click="onReset">重置</button>
              <button type="button" class="btn" @click="openAddCliff">新增崖墓群</button>
              <button type="button" class="btn" @click="exportCliffs">导出</button>
            </div>

            <div class="admin-table-wrap" v-loading="loading">
              <el-table :data="cliffList" border class="admin-el-table" row-key="id" empty-text="无匹配记录">
                <el-table-column type="selection" width="44" align="center" />
                <el-table-column prop="name" label="名称" min-width="160" align="left" show-overflow-tooltip />
                <el-table-column label="地址" min-width="170" align="left" show-overflow-tooltip>
                  <template #default="{ row }">{{ [row.town, row.address].filter(Boolean).join(' ') || '—' }}</template>
                </el-table-column>
                <el-table-column label="坐标" width="150" align="center">
                  <template #default="{ row }">{{ row.lng && row.lat ? `${row.lng}, ${row.lat}` : '—' }}</template>
                </el-table-column>
                <el-table-column prop="area" label="面积" width="90" align="right">
                  <template #default="{ row }">{{ row.area ? `${row.area}㎡` : '—' }}</template>
                </el-table-column>
                <el-table-column prop="level" label="级别" width="180" align="left" show-overflow-tooltip />
                <el-table-column prop="protectionUnitName" label="文物保护单位名称" min-width="180" align="left" show-overflow-tooltip>
                  <template #default="{ row }">{{ row.protectionUnitName || '—' }}</template>
                </el-table-column>
                <el-table-column prop="era" label="年代" width="80" align="center" />
                <el-table-column prop="category" label="类别" width="110" align="center" />
                <el-table-column prop="composition" label="文物构成" min-width="150" align="left" show-overflow-tooltip>
                  <template #default="{ row }">{{ row.composition || '—' }}</template>
                </el-table-column>
                <el-table-column prop="intro" label="简介" min-width="180" align="left" show-overflow-tooltip>
                  <template #default="{ row }">{{ (row.intro || '').replace(/<[^>]+>/g, '') || '—' }}</template>
                </el-table-column>
                <el-table-column label="状态" width="90" align="center">
                  <template #default="{ row }">
                    <span :class="row.status === 'disabled' ? 'cliff-status cliff-status--off' : 'cliff-status'">
                      {{ row.status === 'disabled' ? '禁用' : '启用' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="230" fixed="right" align="center">
                  <template #default="{ row }">
                    <div class="admin-table-actions">
                      <button type="button" class="btn btn-ghost" @click.stop="viewCliff(row)">查看</button>
                      <button type="button" class="btn btn-ghost" @click.stop="openEditCliff(row)">编辑</button>
                      <button type="button" class="btn btn-ghost" @click.stop="toggleCliffStatus(row)">
                        {{ row.status === 'disabled' ? '启用' : '禁用' }}
                      </button>
                      <button type="button" class="btn btn-danger" @click.stop="removeCliff(row.id)">删除</button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="admin-pagination" v-if="cliffTotal > 0">
              <el-pagination
                v-model:current-page="cliffCurrentPage"
                v-model:page-size="cliffPageSize"
                :page-sizes="[10, 20, 50]"
                :total="cliffTotal"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleCliffSizeChange"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="大耳朵墓口" name="entrance">
        <div class="admin-card">
          <div class="admin-toolbar">
            <button type="button" class="btn btn-primary" :disabled="!bigEarCliffId" @click="openAddEntrance">新增墓口</button>
            <span v-if="bigEarCliffId" class="admin-hint">关联崖墓群：大耳朵崖墓群（ID {{ bigEarCliffId }}）</span>
            <span v-else class="admin-hint admin-hint--warn">未找到大耳朵崖墓群，墓口台账暂不可用</span>
          </div>

          <div class="admin-table-wrap" v-loading="entranceLoading">
            <el-table :data="entranceList" border class="admin-el-table" row-key="id" empty-text="无匹配记录">
              <el-table-column
                type="index"
                label="序号"
                width="70"
                :index="(i: number) => (entranceCurrentPage - 1) * entrancePageSize + i + 1"
                align="center"
              />
              <el-table-column prop="direction" label="朝向/编号" width="120" align="left" />
              <el-table-column label="X" width="90" align="right">
                <template #default="{ row }">{{ row.x ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="Y" width="90" align="right">
                <template #default="{ row }">{{ row.y ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="Z" width="90" align="right">
                <template #default="{ row }">{{ row.z ?? '—' }}</template>
              </el-table-column>
              <el-table-column prop="intro" label="简介" min-width="220" align="left" show-overflow-tooltip>
                <template #default="{ row }">{{ row.intro || '—' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="admin-table-actions">
                    <button type="button" class="btn" @click="openEditEntrance(row)">编辑</button>
                    <button type="button" class="btn btn-danger" @click="removeEntrance(row.id)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="admin-pagination" v-if="entranceTotal > 0">
            <el-pagination
              v-model:current-page="entranceCurrentPage"
              v-model:page-size="entrancePageSize"
              :page-sizes="[10, 20, 50]"
              :total="entranceTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleEntranceSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showDetail" :title="selectedCliff?.name || ''" width="640px" destroy-on-close>
      <div class="cliff-detail" v-if="selectedCliff" v-loading="detailLoading">
        <div class="detail-grid">
          <div class="detail-item" v-if="selectedCliff.code"><span class="detail-label">编号</span><span class="detail-value">{{ selectedCliff.code }}</span></div>
          <div class="detail-item"><span class="detail-label">所属乡镇</span><span class="detail-value">{{ selectedCliff.town || '—' }}</span></div>
          <div class="detail-item" v-if="selectedCliff.level"><span class="detail-label">保护级别</span><span class="detail-value">{{ selectedCliff.level }}</span></div>
          <div class="detail-item" v-if="selectedCliff.protectionUnitName"><span class="detail-label">文物保护单位</span><span class="detail-value">{{ selectedCliff.protectionUnitName }}</span></div>
          <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">{{ selectedCliff.status === 'disabled' ? '禁用' : '启用' }}</span></div>
          <div class="detail-item" v-if="selectedCliff.era"><span class="detail-label">年代</span><span class="detail-value">{{ selectedCliff.era }}</span></div>
          <div class="detail-item" v-if="selectedCliff.category"><span class="detail-label">类别</span><span class="detail-value">{{ selectedCliff.category }}</span></div>
          <div class="detail-item" v-if="selectedCliff.area"><span class="detail-label">面积</span><span class="detail-value">{{ selectedCliff.area }}</span></div>
          <div class="detail-item" v-if="selectedCliff.lng"><span class="detail-label">经度</span><span class="detail-value">{{ selectedCliff.lng }}</span></div>
          <div class="detail-item" v-if="selectedCliff.lat"><span class="detail-label">纬度</span><span class="detail-value">{{ selectedCliff.lat }}</span></div>
        </div>
        <div v-if="selectedCliff.address" class="detail-section">
          <h4>地址</h4>
          <p>{{ selectedCliff.address }}</p>
        </div>
        <div v-if="selectedCliff.composition" class="detail-section">
          <h4>构成</h4>
          <p>{{ selectedCliff.composition }}</p>
        </div>
        <div v-if="selectedCliff.intro" class="detail-section">
          <h4>简介</h4>
          <div v-html="selectedCliff.intro"></div>
        </div>
        <div v-if="detailImageUrls().length" class="detail-section">
          <h4>影像</h4>
          <div class="cliff-detail-media">
            <img
              v-for="url in detailImageUrls()"
              :key="url"
              :src="url"
              class="detail-img"
              alt="崖墓影像"
              title="点击放大"
              @click="openDetailImage(url)"
            />
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showCliffDialog" :title="isEditingCliff ? '编辑崖墓群' : '新增崖墓群'" width="720px" destroy-on-close>
      <el-form label-width="110px">
        <div class="form-grid">
          <el-form-item label="编号"><el-input v-model="newCliff.code" placeholder="留空自动生成" /></el-form-item>
          <el-form-item label="名称"><el-input v-model="newCliff.name" /></el-form-item>
          <el-form-item label="所属乡镇">
            <el-select v-model="newCliff.town" placeholder="选择乡镇" filterable style="width: 100%">
              <el-option v-for="t in TOWN_OPTIONS" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="保护级别">
            <el-select v-model="newCliff.level" placeholder="选择级别" style="width: 100%">
              <el-option v-for="l in LEVEL_OPTIONS" :key="l" :label="l" :value="l" />
            </el-select>
          </el-form-item>
          <el-form-item label="年代"><el-input v-model="newCliff.era" placeholder="如：东汉" /></el-form-item>
          <el-form-item label="类别">
            <el-select v-model="newCliff.category" placeholder="选择类别" style="width: 100%">
              <el-option v-for="c in CATEGORY_OPTIONS" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="经度"><el-input v-model="newCliff.lng" placeholder="如 105.84" /></el-form-item>
          <el-form-item label="纬度"><el-input v-model="newCliff.lat" placeholder="如 28.62" /></el-form-item>
          <el-form-item label="面积(㎡)"><el-input v-model="newCliff.area" /></el-form-item>
          <el-form-item label="状态">
            <el-select v-model="newCliff.status" style="width: 100%">
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item label="首页点位 X%">
            <el-input v-model="newCliff.mapLeft" placeholder="0-100，留空按算法分布" />
          </el-form-item>
          <el-form-item label="首页点位 Y%">
            <el-input v-model="newCliff.mapTop" placeholder="0-100，留空按算法分布" />
          </el-form-item>
        </div>
        <el-form-item label="首页重点标注">
          <el-switch v-model="newCliff.featured" active-text="在首页地图重点显示" />
        </el-form-item>
        <el-form-item label="文物保护单位"><el-input v-model="newCliff.protectionUnitName" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="newCliff.address" /></el-form-item>
        <el-form-item label="文物构成"><el-input v-model="newCliff.composition" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="newCliff.intro" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="封面图片">
          <div class="cliff-media-row">
            <img
              v-if="newCliff.coverImage"
              :src="newCliff.coverImage"
              class="cliff-thumb"
              alt="崖墓封面"
              title="点击放大"
              @click="openEditImage(newCliff.coverImage)"
            />
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="onCoverSelect"
            >
              <button type="button" class="btn" :disabled="coverUploading">
                {{ coverUploading ? '上传中…' : (newCliff.coverImage ? '更换封面' : '上传封面') }}
              </button>
            </el-upload>
            <button v-if="newCliff.coverImage" type="button" class="btn" @click="removeCoverImage">移除</button>
          </div>
        </el-form-item>
        <el-form-item label="详情图片">
          <div class="cliff-gallery">
            <div v-for="(img, i) in (newCliff.images || [])" :key="i" class="cliff-gallery-item">
              <img
                :src="img.imageUrl"
                class="cliff-thumb"
                alt="崖墓详情图"
                title="点击放大"
                @click="openEditImage(img.imageUrl)"
              />
              <button type="button" class="btn" @click="removeGalleryImage(i)">移除</button>
            </div>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="onGallerySelect"
            >
              <button type="button" class="btn" :disabled="galleryUploading">
                {{ galleryUploading ? '上传中…' : '添加图片' }}
              </button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="崖墓模型地址">
          <div class="cliff-model-row">
            <el-input v-model="newCliff.modelUrl" placeholder="如 /uploads/models/tomb.glb，留空则游客端显示模型待补充空态" />
            <button type="button" class="btn" :disabled="modelChecking" @click="checkModel">
              {{ modelChecking ? '校验中…' : '校验地址' }}
            </button>
          </div>
          <p class="cliff-model-hint">保存时会再次校验，地址不可达将拒绝保存。</p>
          <div v-if="editModelUrl" class="cliff-model-preview">
            <model-viewer
              v-if="modelViewerReady"
              :src="editModelUrl"
              camera-controls
              touch-action="pan-y"
              shadow-intensity="1"
              environment-image="neutral"
              alt="崖墓三维模型"
            ></model-viewer>
            <p v-else class="cliff-model-loading">三维模型加载中…</p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showCliffDialog = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveCliff" :disabled="cliffDialogLoading">
          {{ isEditingCliff ? '保存' : '确定' }}
        </button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddEntrance" title="新增墓口" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="朝向/编号"><el-input v-model="newEntrance.direction" placeholder="如 M1" /></el-form-item>
        <el-form-item label="坐标 X"><el-input-number v-model="newEntrance.x" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="坐标 Y"><el-input-number v-model="newEntrance.y" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="坐标 Z"><el-input-number v-model="newEntrance.z" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="newEntrance.intro" type="textarea" :rows="3" placeholder="墓口保存状况等" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showAddEntrance = false">取消</button>
        <button type="button" class="btn btn-primary" @click="addEntrance" :disabled="addEntranceLoading">确定</button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditEntrance" title="编辑墓口" width="520px" destroy-on-close>
      <el-form label-width="100px" v-if="editingEntrance">
        <el-form-item label="朝向/编号"><el-input v-model="editingEntrance.direction" placeholder="如 M1" /></el-form-item>
        <el-form-item label="坐标 X"><el-input-number v-model="editingEntrance.x" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="坐标 Y"><el-input-number v-model="editingEntrance.y" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="坐标 Z"><el-input-number v-model="editingEntrance.z" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="editingEntrance.intro" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEditEntrance = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveEntrance" :disabled="editEntranceLoading">保存</button>
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
.cliff-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cliff-tabs {
  background: transparent;
}

.cliff-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.admin-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.cliff-map {
  padding: 16px;
}

.map-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 60%, #81c784 100%);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(90, 155, 138, 0.25);
}

.map-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-caption {
  margin: 10px 2px 0;
  font-size: 0.76rem;
  color: var(--admin-muted);

  strong { color: var(--admin-text); }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.cliff-status {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  font-size: 0.72rem;

  &.cliff-status--off {
    background: rgba(148, 163, 184, 0.18);
    color: #64748b;
  }
}

.map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 1;
}

.marker-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #b54a3c;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

  .featured & {
    width: 18px;
    height: 18px;
    background: var(--admin-jade);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2);
  }
}

.marker-label {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 700;
  color: var(--admin-heading);
  background: rgba(255, 255, 255, 0.9);
  padding: 0 4px;
  border-radius: 3px;
  line-height: 1.4;
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

.admin-hint {
  font-size: 0.82rem;
  color: var(--admin-muted);

  &--warn {
    color: var(--admin-danger, #dc2626);
  }
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

  &:disabled {
    opacity: 0.5;
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

.cliff-detail {
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 24px;
    margin-bottom: 16px;
  }

  .detail-item {
    display: flex;
    gap: 8px;
  }

  .detail-label {
    color: var(--admin-muted);
    font-size: 0.88rem;
    white-space: nowrap;
    min-width: 70px;
  }

  .detail-value {
    color: var(--admin-text);
    font-size: 0.88rem;
    font-weight: 500;
  }

  .detail-section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--admin-border);

    h4 {
      margin: 0 0 8px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--admin-heading);
      font-family: "STKaiti", "KaiTi", "SimSun", "Noto Serif SC", serif;
    }

    p {
      margin: 0;
      font-size: 0.88rem;
      color: var(--admin-text);
      line-height: 1.6;
    }
  }
}

@media (max-width: 900px) {
  .cliff-overview {
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

.cliff-media-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cliff-gallery {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.cliff-gallery-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cliff-thumb {
  width: 96px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--admin-border, #e4e7ed);
  cursor: zoom-in;
}

.cliff-detail-media {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-img {
  width: 120px;
  height: 84px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--admin-border, #e4e7ed);
  cursor: zoom-in;
}

.cliff-model-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  margin-top: 8px;
  background: #0f172a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  model-viewer {
    width: 100%;
    height: 100%;
  }
}

.cliff-model-loading {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.cliff-model-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.cliff-model-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--admin-text-secondary, #909399);
}
</style>
