<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getRoleList, createRole, updateRole, deleteRole, type Role } from '@/api/system'
import { permissionMenus } from '@/data/admin-store'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const allRoles = ref<Role[]>([])
const permRole = ref<Role | null>(null)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const activeTab = ref('list')

const showEdit = ref(false)
const editingRole = ref<Partial<Role> | null>(null)
const isAdd = ref(false)

const scopeLabels: Record<string, string> = { all: '全部数据', dept: '本部门数据', deptAndBelow: '本部门及以下', self: '仅本人' }

interface TreeRow {
  row: Role
  level: number
}

interface TreeNode extends Role {
  children: TreeNode[]
}

function buildTree(items: Role[]): TreeNode[] {
  const byParent: Record<string, Role[]> = {}
  items.forEach(d => {
    const p = d.parentId == null || d.parentId === '' ? '' : d.parentId
    if (!byParent[p]) byParent[p] = []
    byParent[p].push(d)
  })
  Object.keys(byParent).forEach(k => {
    byParent[k].sort((a, b) => {
      return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), 'zh-CN')
    })
  })
  function walk(pid: string): TreeNode[] {
    return (byParent[pid] || []).map(d => ({
      ...d,
      children: walk(d.id),
    }))
  }
  return walk('')
}

function treeRows(items: Role[]): TreeRow[] {
  const byParent: Record<string, Role[]> = {}
  items.forEach(d => {
    const p = d.parentId == null || d.parentId === '' ? '' : d.parentId
    if (!byParent[p]) byParent[p] = []
    byParent[p].push(d)
  })
  Object.keys(byParent).forEach(k => {
    byParent[k].sort((a, b) => {
      return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), 'zh-CN')
    })
  })
  const out: TreeRow[] = []
  function walk(pid: string, level: number) {
    const list = byParent[pid] || []
    list.forEach(d => {
      out.push({ row: d, level })
      walk(d.id, level + 1)
    })
  }
  walk('', 0)
  return out
}

function isDescendant(maybeDescId: string, ancestorId: string): boolean {
  if (!maybeDescId || maybeDescId === ancestorId) return maybeDescId === ancestorId
  let cur = allRoles.value.find(x => x.id === maybeDescId)
  while (cur && cur.parentId) {
    if (cur.parentId === ancestorId) return true
    cur = allRoles.value.find(x => x.id === cur!.parentId)
  }
  return false
}

function hasChildRoles(id: string): boolean {
  return allRoles.value.some(r => r.parentId === id)
}

const list = computed<TreeNode[]>(() => {
  let filtered = [...allRoles.value]
  const kw = appliedKeyword.value.trim().toLowerCase()
  if (kw) {
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(kw) || 
      r.code.toLowerCase().includes(kw)
    )
    // 当搜索时，也包含匹配项的所有祖先，确保上下文可见
    const matchingIds = new Set(filtered.map(r => r.id))
    const includeIds = new Set<string>()
    filtered.forEach(r => {
      let current: Role | undefined = r
      while (current) {
        includeIds.add(current.id)
        current = allRoles.value.find(x => x.id === current!.parentId)
      }
    })
    filtered = allRoles.value.filter(r => includeIds.has(r.id))
  }
  return buildTree(filtered)
})

function getParentRoleName(parentId: string | null): string {
  if (!parentId) return ''
  const parent = allRoles.value.find(r => r.id === parentId)
  return parent?.name || ''
}

async function fetchAllRoles() {
  loading.value = true
  try {
    const res = await getRoleList({ pageSize: 999 })
    allRoles.value = res.items
  } catch {
    allRoles.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  appliedKeyword.value = draftKeyword.value
}

function onReset() {
  draftKeyword.value = ''
  appliedKeyword.value = ''
}

function openAdd() {
  isAdd.value = true
  editingRole.value = { name: '', code: '', sort: 1, dataScope: 'dept', remark: '', permissionIds: [], parentId: null }
  showEdit.value = true
}

function openEdit(r: Role) {
  isAdd.value = false
  editingRole.value = { ...r, permissionIds: [...r.permissionIds] }
  showEdit.value = true
}

async function saveRole() {
  if (!editingRole.value) return
  
  if (!isAdd.value && editingRole.value.parentId && isDescendant(editingRole.value.parentId, editingRole.value.id!)) {
    ElMessage.warning('不能将上级设为自己的下级')
    return
  }
  
  if (editingRole.value.parentId === '') {
    editingRole.value.parentId = null
  }
  
  try {
    if (isAdd.value) {
      await createRole(editingRole.value)
      ElMessage.success('新增成功')
    } else {
      await updateRole(editingRole.value.id!, editingRole.value)
      ElMessage.success('保存成功')
    }
    showEdit.value = false
    await fetchAllRoles()
  } catch {
    /* error handled by interceptor */
  }
}

async function handleDelete(id: string) {
  if (hasChildRoles(id)) {
    ElMessage.warning('请先删除或调整子角色')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定删除该角色？', '提示', { type: 'warning' })
    await deleteRole(id)
    ElMessage.success('已删除')
    await fetchAllRoles()
  } catch {
    /* user cancel */
  }
}

function togglePerm(permId: string) {
  if (!editingRole.value) return
  const ids = editingRole.value.permissionIds || []
  const idx = ids.indexOf(permId)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(permId)
}

function selectPermRole(r: Role) {
  permRole.value = { ...r, permissionIds: [...r.permissionIds] }
}

function openPermConfig(r: Role) {
  activeTab.value = 'perms'
  selectPermRole(r)
}

function togglePermRolePerm(permId: string) {
  if (!permRole.value) return
  const idx = permRole.value.permissionIds.indexOf(permId)
  if (idx >= 0) permRole.value.permissionIds.splice(idx, 1)
  else permRole.value.permissionIds.push(permId)
}

async function savePermRole() {
  if (!permRole.value) return
  try {
    await updateRole(permRole.value.id, { permissionIds: permRole.value.permissionIds })
    ElMessage.success('权限已保存')
    await fetchAllRoles()
  } catch {
    /* error handled by interceptor */
  }
}

function getIndentClass(level: number): string {
  const l = Math.min(level, 3)
  return l ? `role-indent role-indent--${l}` : 'role-indent'
}

function getParentRoleOptions(excludeId?: string): TreeRow[] {
  return treeRows(allRoles.value).filter(item => {
    if (!excludeId) return true
    // 排除自己和自己的所有后代
    return item.row.id !== excludeId && !isDescendant(item.row.id, excludeId)
  })
}

function getOptionLabel(item: TreeRow): string {
  const prefix = '\u3000'.repeat(item.level)
  return prefix + item.row.name
}

onMounted(() => {
  fetchAllRoles()
})
</script>

<template>
  <div class="role-page">
    <AdminPageHeader title="角色管理" :crumbs="['首页', '组织与权限', '角色管理']" />
    <el-tabs v-model="activeTab">
      <el-tab-pane label="角色列表" name="list">
        <div class="admin-card">
          <p class="org-hint">列表按层级缩进；删除前需解除子角色与用户关联。</p>
          <div class="admin-toolbar">
            <el-input
              v-model="draftKeyword"
              placeholder="角色名称 / 角色标识"
              clearable
              class="toolbar-search"
              @keyup.enter="onSearch"
            />
            <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
            <button type="button" class="btn" @click="onReset">重置</button>
            <button type="button" class="btn btn-primary" @click="openAdd">新增角色</button>
          </div>

          <div class="admin-table-wrap" v-loading="loading">
            <el-table
              :data="list"
              border
              class="admin-el-table"
              row-key="id"
              default-expand-all
              :tree-props="{ children: 'children' }"
              empty-text="无匹配记录"
            >
              <el-table-column prop="name" label="角色名称" min-width="180" align="left" />
              <el-table-column prop="code" label="角色标识" width="140" align="left" />
              <el-table-column label="上级角色" width="120" align="left">
                <template #default="{ row }">{{ getParentRoleName(row.parentId) || '—' }}</template>
              </el-table-column>
              <el-table-column label="权限" width="100" align="right">
                <template #default="{ row }">{{ row.permissionIds.length }} 项</template>
              </el-table-column>
              <el-table-column label="操作" width="250" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="admin-table-actions">
                    <button type="button" class="btn" @click="openEdit(row)">编辑</button>
                    <button type="button" class="btn" @click="openPermConfig(row)">配置权限</button>
                    <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="权限配置" name="perms">
        <div class="admin-card">
          <div class="perm-config">
            <div class="perm-role-select">
              <h4>选择角色</h4>
              <div v-for="item in treeRows(allRoles)" :key="item.row.id" class="perm-role-item" :class="{ active: permRole?.id === item.row.id }" @click="selectPermRole(item.row)">
                <span :class="getIndentClass(item.level)">{{ item.row.name }}</span>
              </div>
            </div>
            <div class="perm-grid" v-if="permRole">
              <h4>{{ permRole.name }} — 权限配置</h4>
              <div class="perm-checkboxes">
                <label v-for="p in permissionMenus" :key="p.id" class="perm-check">
                  <input type="checkbox" :checked="permRole.permissionIds.includes(p.id)" @change="togglePermRolePerm(p.id)" />
                  <span>{{ p.label }}</span>
                </label>
              </div>
              <button type="button" class="btn btn-primary" style="margin-top: 16px" @click="savePermRole">保存权限</button>
            </div>
            <div v-else class="perm-empty">请先选择一个角色</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showEdit" :title="isAdd ? '新增角色' : '编辑角色'" width="560px" destroy-on-close>
      <el-form label-width="100px" v-if="editingRole">
        <el-form-item label="角色名称"><el-input v-model="editingRole.name" /></el-form-item>
        <el-form-item label="角色标识"><el-input v-model="editingRole.code" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="editingRole.sort" :min="1" /></el-form-item>
        <el-form-item label="上级角色">
          <el-select v-model="editingRole.parentId" placeholder="无上级角色" clearable>
            <el-option value="">（顶级角色）</el-option>
            <el-option v-for="item in getParentRoleOptions(editingRole?.id)" :key="item.row.id" :label="getOptionLabel(item)" :value="item.row.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据权限">
          <el-select v-model="editingRole.dataScope">
            <el-option v-for="(label, key) in scopeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="editingRole.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEdit = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveRole">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.role-page {
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

.org-hint {
  margin: 0 0 10px;
  padding: 14px 16px 0;
  font-size: 0.82rem;
  color: var(--admin-muted);
  line-height: 1.5;
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

.perm-config {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  min-height: 300px;
}

.perm-role-select {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 16px;

  h4 {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--admin-text);
  }
}

.perm-role-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--admin-muted);
  transition: background 0.15s;

  &:hover { background: rgba(0, 0, 0, 0.04); }
  &.active {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
    font-weight: 600;
  }
}

.role-indent { padding-left: 8px; }
.role-indent--1 { padding-left: 22px; }
.role-indent--2 { padding-left: 38px; }
.role-indent--3 { padding-left: 54px; }

.perm-grid {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 16px;

  h4 {
    margin: 0 0 16px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--admin-text);
  }
}

.perm-checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.perm-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--admin-muted);
  cursor: pointer;

  input { accent-color: #409eff; }
}

.perm-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--admin-muted);
  font-size: 0.92rem;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
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
</style>
