<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getCliffList,
  getCliffDetail,
  createCliff,
  deleteCliff,
  getEntrances,
  createEntrance,
  updateEntrance,
  deleteEntrance,
  LEVEL_OPTIONS,
  CATEGORY_OPTIONS,
  TOWN_OPTIONS,
  MAP_MARKERS_13,
  type CliffVo,
  type CliffQuery,
  type EntranceVo,
} from '@/api/cliff'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('overview')

const loading = ref(false)
const cliffList = ref<CliffVo[]>([])
const cliffTotal = ref(0)
const cliffCurrentPage = ref(1)
const cliffPageSize = ref(10)

const draftKeyword = ref('')
const draftLevel = ref('')
const draftTown = ref('')
const appliedKeyword = ref('')
const appliedLevel = ref('')
const appliedTown = ref('')

function buildCliffQuery(page = cliffCurrentPage.value): CliffQuery {
  return {
    page,
    pageSize: cliffPageSize.value,
    keyword: appliedKeyword.value.trim() || undefined,
    level: appliedLevel.value || undefined,
    town: appliedTown.value || undefined,
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
  cliffCurrentPage.value = 1
  fetchCliffList(1)
}

function onReset() {
  draftKeyword.value = ''
  draftLevel.value = ''
  draftTown.value = ''
  appliedKeyword.value = ''
  appliedLevel.value = ''
  appliedTown.value = ''
  cliffCurrentPage.value = 1
  fetchCliffList(1)
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

const showAddCliff = ref(false)
const addCliffLoading = ref(false)
const newCliff = ref<Partial<CliffVo>>({ name: '', town: '' })

function openAddCliff() {
  newCliff.value = { name: '', town: '' }
  showAddCliff.value = true
}

async function addCliff() {
  if (!newCliff.value.name?.trim()) {
    ElMessage.warning('请输入崖墓群名称')
    return
  }
  addCliffLoading.value = true
  try {
    await createCliff(newCliff.value)
    ElMessage.success('新增成功')
    showAddCliff.value = false
    await fetchCliffList()
  } catch {
    /* error handled by interceptor */
  } finally {
    addCliffLoading.value = false
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

async function fetchEntranceList(page = entranceCurrentPage.value) {
  entranceLoading.value = true
  try {
    const res = await getEntrances({ page, pageSize: entrancePageSize.value })
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
const newEntrance = ref<Partial<EntranceVo>>({ name: '', direction: '', width: '', height: '', depth: '', shape: '', status: '完好' })

function openAddEntrance() {
  newEntrance.value = { name: '', direction: '', width: '', height: '', depth: '', shape: '', status: '完好' }
  showAddEntrance.value = true
}

async function addEntrance() {
  if (!newEntrance.value.name?.trim()) {
    ElMessage.warning('请输入墓口编号')
    return
  }
  addEntranceLoading.value = true
  try {
    await createEntrance(newEntrance.value)
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
  editingEntrance.value = { ...e }
  showEditEntrance.value = true
}

async function saveEntrance() {
  if (!editingEntrance.value) return
  editEntranceLoading.value = true
  try {
    await updateEntrance(editingEntrance.value.id, editingEntrance.value)
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
    await deleteEntrance(id)
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

function statusTagClass(status: string) {
  if (status === '完好') return 'action-success'
  if (status === '轻微风化') return 'action-warning'
  if (status === '风化') return 'action-danger'
  return 'action-info'
}

const mapMarkers = MAP_MARKERS_13

watch(cliffCurrentPage, (page, prev) => {
  if (page !== prev) fetchCliffList(page)
})

watch(entranceCurrentPage, (page, prev) => {
  if (page !== prev) fetchEntranceList(page)
})

onMounted(() => {
  fetchCliffList()
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
                <div class="map-bg"></div>
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
              <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
              <button type="button" class="btn" @click="onReset">重置</button>
              <button type="button" class="btn btn-primary" @click="openAddCliff">新增崖墓群</button>
            </div>

            <div class="admin-table-wrap" v-loading="loading">
              <el-table :data="cliffList" border class="admin-el-table" row-key="id" empty-text="无匹配记录">
                <el-table-column
                  type="index"
                  label="序号"
                  width="70"
                  :index="(i: number) => (cliffCurrentPage - 1) * cliffPageSize + i + 1"
                  align="center"
                />
                <el-table-column prop="name" label="名称" min-width="180" align="left" />
                <el-table-column prop="town" label="所属乡镇" width="140" align="left" />
                <el-table-column prop="level" label="保护级别" width="180" align="left" />
                <el-table-column prop="era" label="年代" width="80" align="center" />
                <el-table-column prop="category" label="类别" width="100" align="center" />
                <el-table-column label="操作" width="140" fixed="right" align="center">
                  <template #default="{ row }">
                    <div class="admin-table-actions">
                      <button type="button" class="btn" @click.stop="viewCliff(row)">查看</button>
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
            <button type="button" class="btn btn-primary" @click="openAddEntrance">新增墓口</button>
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
              <el-table-column prop="name" label="墓口编号" width="120" align="left" />
              <el-table-column prop="direction" label="朝向" width="100" align="left" />
              <el-table-column prop="width" label="宽(m)" width="90" align="right" />
              <el-table-column prop="height" label="高(m)" width="90" align="right" />
              <el-table-column prop="depth" label="深(m)" width="90" align="right" />
              <el-table-column prop="shape" label="形制" width="100" align="left" />
              <el-table-column prop="status" label="保存状况" width="120" align="center">
                <template #default="{ row }">
                  <span :class="['action-tag', statusTagClass(row.status)]">{{ row.status }}</span>
                </template>
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
          <div class="detail-item"><span class="detail-label">所属乡镇</span><span class="detail-value">{{ selectedCliff.town }}</span></div>
          <div class="detail-item" v-if="selectedCliff.level"><span class="detail-label">保护级别</span><span class="detail-value">{{ selectedCliff.level }}</span></div>
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
      </div>
    </el-dialog>

    <el-dialog v-model="showAddCliff" title="新增崖墓群" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="名称"><el-input v-model="newCliff.name" /></el-form-item>
        <el-form-item label="所属乡镇">
          <el-select v-model="newCliff.town" placeholder="选择乡镇" filterable>
            <el-option v-for="t in TOWN_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="保护级别">
          <el-select v-model="newCliff.level" placeholder="选择级别">
            <el-option v-for="l in LEVEL_OPTIONS" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="年代"><el-input v-model="newCliff.era" placeholder="如：东汉" /></el-form-item>
        <el-form-item label="类别">
          <el-select v-model="newCliff.category" placeholder="选择类别">
            <el-option v-for="c in CATEGORY_OPTIONS" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showAddCliff = false">取消</button>
        <button type="button" class="btn btn-primary" @click="addCliff" :disabled="addCliffLoading">确定</button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddEntrance" title="新增墓口" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="墓口编号"><el-input v-model="newEntrance.name" /></el-form-item>
        <el-form-item label="朝向"><el-input v-model="newEntrance.direction" /></el-form-item>
        <el-form-item label="宽(m)"><el-input v-model="newEntrance.width" /></el-form-item>
        <el-form-item label="高(m)"><el-input v-model="newEntrance.height" /></el-form-item>
        <el-form-item label="深(m)"><el-input v-model="newEntrance.depth" /></el-form-item>
        <el-form-item label="形制"><el-input v-model="newEntrance.shape" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showAddEntrance = false">取消</button>
        <button type="button" class="btn btn-primary" @click="addEntrance" :disabled="addEntranceLoading">确定</button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditEntrance" title="编辑墓口" width="520px" destroy-on-close>
      <el-form label-width="100px" v-if="editingEntrance">
        <el-form-item label="墓口编号"><el-input v-model="editingEntrance.name" /></el-form-item>
        <el-form-item label="朝向"><el-input v-model="editingEntrance.direction" /></el-form-item>
        <el-form-item label="宽(m)"><el-input v-model="editingEntrance.width" /></el-form-item>
        <el-form-item label="高(m)"><el-input v-model="editingEntrance.height" /></el-form-item>
        <el-form-item label="深(m)"><el-input v-model="editingEntrance.depth" /></el-form-item>
        <el-form-item label="形制"><el-input v-model="editingEntrance.shape" /></el-form-item>
        <el-form-item label="保存状况"><el-input v-model="editingEntrance.status" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEditEntrance = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveEntrance" :disabled="editEntranceLoading">保存</button>
      </template>
    </el-dialog>
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

.map-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(46, 125, 50, 0.15), transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(27, 94, 32, 0.12), transparent 50%);
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
</style>
