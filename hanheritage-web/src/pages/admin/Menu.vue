<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getMenuTree, createMenu, updateMenu, deleteMenu, fmtDate } from '@/api/system'
import type { MenuItem } from '@/api/system'
import { useMenuStore } from '@/stores/menu'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const menuStore = useMenuStore()

const loading = ref(false)
const menuTree = ref<MenuItem[]>([])
const filteredTree = ref<MenuItem[]>([])
const totalCount = ref(0)
const expandedRows = ref<string[]>([])
const tableRef = ref<InstanceType<typeof import('element-plus')['ElTable']> | null>(null)

const searchKeyword = ref('')
const filterStatus = ref('all')

const showEdit = ref(false)
const editingMenu = ref<MenuItem | null>(null)
const isAdd = ref(false)
const addParentId = ref<string | null>(null)
const sortSaving = ref(false)

function flattenRows(tree: MenuItem[], out: MenuItem[] = []): MenuItem[] {
  tree.forEach(item => {
    out.push(item)
    flattenRows(item.children || [], out)
  })
  return out
}

async function saveSort() {
  const rows = flattenRows(filteredTree.value)
  sortSaving.value = true
  try {
    await Promise.all(rows.filter(row => row.id).map(row => updateMenu(row.id, { sort: row.sort })))
    ElMessage.success('排序已保存')
    await fetchTree()
    await menuStore.loadMenuItems()
  } catch {
    /* 请求失败已由拦截器提示 */
  } finally {
    sortSaving.value = false
  }
}

function getIconComponent(iconName: string) {
  if (!iconName) return null
  const pascalName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return (ElementPlusIconsVue as any)[pascalName] || null
}

function countNodes(tree: MenuItem[]): number {
  let count = 0
  tree.forEach(m => { count++; count += countNodes(m.children) })
  return count
}

async function fetchTree() {
  loading.value = true
  try {
    const data = await getMenuTree()
    menuTree.value = data
    totalCount.value = countNodes(data)
    expandedRows.value = getParentIds(data)
    applyFilter()
  } catch {
    menuTree.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function filterTree(tree: MenuItem[], keyword: string, status: string): MenuItem[] {
  return tree
    .map(m => {
      const filteredChildren = filterTree(m.children || [], keyword, status)
      const matchKeyword = !keyword || m.name.toLowerCase().includes(keyword.toLowerCase())
      const matchStatus = status === 'all' || m.status === status
      if (matchKeyword && matchStatus) {
        return { ...m, children: filteredChildren }
      } else if (filteredChildren.length > 0) {
        return { ...m, children: filteredChildren }
      }
      return null
    })
    .filter((m): m is MenuItem => m !== null)
}

function applyFilter() {
  filteredTree.value = filterTree(menuTree.value, searchKeyword.value, filterStatus.value)
}

function onSearch() {
  applyFilter()
}

function onReset() {
  searchKeyword.value = ''
  filterStatus.value = 'all'
  applyFilter()
}

function openAdd(parentId: string | null) {
  isAdd.value = true
  addParentId.value = parentId
  editingMenu.value = {
    id: '',
    name: '',
    icon: '',
    sort: 0,
    perms: '',
    component: '',
    status: 'normal',
    createTime: '',
    linkId: null,
    children: [],
  }
  showEdit.value = true
}

function openEdit(m: MenuItem) {
  isAdd.value = false
  editingMenu.value = { ...m, children: [] }
  showEdit.value = true
}

async function saveMenu() {
  if (!editingMenu.value) return
  try {
    if (isAdd.value) {
      await createMenu({
        name: editingMenu.value.name,
        icon: editingMenu.value.icon,
        sort: editingMenu.value.sort,
        perms: editingMenu.value.perms,
        component: editingMenu.value.component,
        status: editingMenu.value.status,
        linkId: editingMenu.value.linkId,
      } as any)
      ElMessage.success('新增成功')
    } else {
      await updateMenu(editingMenu.value.id, {
        name: editingMenu.value.name,
        icon: editingMenu.value.icon,
        sort: editingMenu.value.sort,
        perms: editingMenu.value.perms,
        component: editingMenu.value.component,
        status: editingMenu.value.status,
        linkId: editingMenu.value.linkId,
      })
      ElMessage.success('修改成功')
    }
    showEdit.value = false
    await fetchTree()
    menuStore.refreshMenu()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该菜单？', '提示', { type: 'warning' })
    await deleteMenu(id)
    ElMessage.success('已删除')
    await fetchTree()
    menuStore.refreshMenu()
  } catch {
    /* 用户取消 */
  }
}

function toggleExpand() {
  if (expandedRows.value.length) {
    expandedRows.value = []
  } else {
    expandedRows.value = getParentIds(filteredTree.value)
  }
}

function getParentIds(tree: MenuItem[]): string[] {
  const ids: string[] = []
  tree.forEach(m => {
    if (m.children && m.children.length > 0) {
      ids.push(m.id)
      ids.push(...getParentIds(m.children))
    }
  })
  return ids
}

function getAllIds(tree: MenuItem[]): string[] {
  const ids: string[] = []
  tree.forEach(m => { ids.push(m.id); ids.push(...getAllIds(m.children)) })
  return ids
}

onMounted(() => fetchTree())
</script>

<template>
  <div class="menu-page">
    <AdminPageHeader title="菜单管理" :crumbs="['首页', '系统配置', '菜单管理']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索菜单名称"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <div class="toolbar-spacer"></div>
        <button type="button" class="btn btn-primary" @click="openAdd(null)">新增菜单</button>
        <button type="button" class="btn" @click="toggleExpand">{{ expandedRows.length ? '全部折叠' : '全部展开' }}</button>
        <button type="button" class="btn btn-primary" :disabled="sortSaving" @click="saveSort">保存排序</button>
        <span class="toolbar-total">共 {{ totalCount }} 项</span>
      </div>

      <div class="admin-table-wrap" v-loading="loading">
        <el-table
          ref="tableRef"
          :data="filteredTree"
          border
          class="admin-el-table"
          row-key="id"
          :expand-row-keys="expandedRows"
          :tree-props="{ children: 'children' }"
          empty-text="暂无菜单数据"
        >
          <el-table-column prop="name" label="菜单名称" min-width="200" align="left" />
          <el-table-column prop="icon" label="图标" width="100" align="center">
            <template #default="{ row }">
              <div v-if="getIconComponent(row.icon)" class="icon-wrapper">
                <component :is="getIconComponent(row.icon)" class="icon-content" />
              </div>
              <span v-else class="icon-text">{{ row.icon || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="110" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.sort"
                :min="0"
                :step="1"
                :controls="false"
                size="small"
                class="sort-input"
              />
            </template>
          </el-table-column>
          <el-table-column prop="perms" label="权限标识" min-width="170" show-overflow-tooltip align="left" />
          <el-table-column prop="component" label="组件路径" min-width="180" show-overflow-tooltip align="left" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <span :class="['action-tag', row.status === 'normal' ? 'action-success' : 'action-danger']">
                {{ row.status === 'normal' ? '正常' : '停用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160" align="center">
            <template #default="{ row }">{{ row.createTime ? fmtDate(row.createTime) : '' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="openAdd(row.id)">新增</button>
                <button type="button" class="btn" @click="openEdit(row)">编辑</button>
                <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="showEdit" :title="isAdd ? '新增菜单' : '编辑菜单'" width="600px" destroy-on-close>
      <el-form label-width="100px" v-if="editingMenu">
        <el-form-item label="菜单名称"><el-input v-model="editingMenu.name" /></el-form-item>
        <el-form-item label="图标">
          <div class="icon-input-wrap">
            <el-input v-model="editingMenu.icon" placeholder="如 user, tree, settings" />
            <el-popover
              ref="iconHelpPopover"
              trigger="hover"
              placement="top"
              width="420"
            >
              <div class="icon-help-content">
                <h4 class="icon-help-title">图标使用说明</h4>
                <p class="icon-help-desc">使用 Element Plus Icons Vue 图标库，填写图标名称（短横线分隔格式）</p>
                <a href="https://element-plus.org/en-US/component/icon.html" target="_blank" class="icon-help-link">Element Plus 图标库</a>
                <div class="icon-help-section">
                  <h5>常用菜单图标推荐：</h5>
                  <div class="icon-help-grid">
                    <span class="icon-help-item">dashboard - 仪表盘</span>
                    <span class="icon-help-item">home - 首页</span>
                    <span class="icon-help-item">tree - 树形结构</span>
                    <span class="icon-help-item">component - 组件</span>
                    <span class="icon-help-item">camera - 相机</span>
                    <span class="icon-help-item">folder - 文件夹</span>
                    <span class="icon-help-item">user - 用户</span>
                    <span class="icon-help-item">peoples - 人员</span>
                    <span class="icon-help-item">lock - 权限</span>
                    <span class="icon-help-item">settings - 设置</span>
                    <span class="icon-help-item">message - 消息</span>
                    <span class="icon-help-item">system - 系统</span>
                    <span class="icon-help-item">server - 服务器</span>
                    <span class="icon-help-item">monitor - 监控</span>
                    <span class="icon-help-item">log - 日志</span>
                    <span class="icon-help-item">online - 在线</span>
                    <span class="icon-help-item">tree-table - 表格树</span>
                    <span class="icon-help-item">postcard - 卡片</span>
                    <span class="icon-help-item">form - 表单</span>
                    <span class="icon-help-item">guide - 引导</span>
                    <span class="icon-help-item">cascader - 级联</span>
                    <span class="icon-help-item">documentation - 文档</span>
                  </div>
                </div>
              </div>
              <template #reference>
                <button type="button" class="icon-help-btn" title="图标帮助">?</button>
              </template>
            </el-popover>
          </div>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="editingMenu.sort" :min="0" /></el-form-item>
        <el-form-item label="权限标识"><el-input v-model="editingMenu.perms" placeholder="如 system:user:list" /></el-form-item>
        <el-form-item label="组件路径"><el-input v-model="editingMenu.component" placeholder="如 system/user/index" /></el-form-item>
        <el-form-item label="路由地址"><el-input v-model="editingMenu.linkId" placeholder="如 user" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editingMenu.status">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEdit = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveMenu">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.menu-page {
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

.toolbar-spacer {
  flex: 1;
}

.toolbar-search {
  width: 260px;
}

.toolbar-total {
  font-size: 0.88rem;
  color: var(--admin-text);
  opacity: 0.7;
}

.sort-input {
  width: 72px;

  :deep(.el-input__inner) {
    text-align: center;
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

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f1f5f9;
  color: var(--admin-text);
}

.icon-content {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.icon-text {
  color: var(--admin-muted);
  font-size: 0.82rem;
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

:deep(.el-input-number) {
  max-width: 200px;
}

:deep(.el-input-number__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
}

:deep(.el-select__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
}

.icon-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-help-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--admin-primary);
  color: #fff;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: var(--admin-primary-hover);
    transform: scale(1.05);
  }
}

.icon-help-content {
  padding: 14px;
}

.icon-help-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--admin-text);
}

.icon-help-desc {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: var(--admin-muted);
  line-height: 1.5;
}

.icon-help-link {
  display: inline-block;
  margin-bottom: 12px;
  padding: 6px 12px;
  background: var(--admin-primary);
  color: #fff;
  text-decoration: none;
  font-size: 0.85rem;
  border-radius: 6px;

  &:hover {
    background: var(--admin-primary-hover);
  }
}

.icon-help-section {
  border-top: 1px solid var(--admin-border);
  padding-top: 12px;
}

.icon-help-section h5 {
  margin: 0 0 10px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--admin-text);
}

.icon-help-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.icon-help-item {
  font-size: 0.82rem;
  color: var(--admin-muted);
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
}
</style>
