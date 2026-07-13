<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getDeptTree, createDept, updateDept, deleteDept } from '@/api/system'
import type { Dept } from '@/api/system'
import { ElMessage, ElMessageBox } from 'element-plus'

interface DeptNode extends Dept {
  children: DeptNode[]
}

const loading = ref(false)
const deptTree = ref<DeptNode[]>([])

const showEdit = ref(false)
const editingDept = ref<DeptNode | null>(null)
const isAdd = ref(false)
const addParentId = ref<string | null>(null)

function transformTreeToCascader(nodes: DeptNode[], level = 0): any[] {
  return nodes.map(node => ({
    value: node.id,
    label: '　'.repeat(level) + node.name,
    children: node.children?.length ? transformTreeToCascader(node.children, level + 1) : undefined,
  }))
}

const cascaderOptions = computed(() => transformTreeToCascader(deptTree.value))

function getParentPath(id: string | null): string[] {
  if (!id) return []
  const path: string[] = []
  let currentId: string | null = id
  while (currentId) {
    const node = findNode(deptTree.value, currentId)
    if (!node) break
    path.unshift(node.id)
    currentId = node.parentId
  }
  return path
}

function findNode(nodes: DeptNode[], id: string): DeptNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

function getParentDeptName(parentId: string | null): string {
  if (!parentId) return ''
  const parent = findNode(deptTree.value, parentId)
  return parent?.name || ''
}

async function fetchTree() {
  loading.value = true
  try {
    const data = await getDeptTree()
    deptTree.value = data as unknown as DeptNode[]
  } catch {
    deptTree.value = []
  } finally {
    loading.value = false
  }
}

function openAdd(parentId: string | null) {
  isAdd.value = true
  addParentId.value = parentId
  editingDept.value = { id: '', name: '', parentId, sort: 1, children: [] }
  showEdit.value = true
}

function openEdit(d: DeptNode) {
  isAdd.value = false
  editingDept.value = { ...d, children: [] }
  showEdit.value = true
}

const parentDeptPath = computed(() => {
  if (!editingDept.value) return []
  if (isAdd.value && addParentId.value) {
    return getParentPath(addParentId.value)
  }
  if (!isAdd.value && editingDept.value.parentId) {
    return getParentPath(editingDept.value.parentId)
  }
  return []
})

async function saveDept() {
  if (!editingDept.value) return
  const selectedParentId = parentDeptPath.value.length > 0 
    ? parentDeptPath.value[parentDeptPath.value.length - 1] 
    : null
  try {
    if (isAdd.value) {
      await createDept({
        name: editingDept.value.name,
        parentId: selectedParentId,
        sort: editingDept.value.sort,
      })
      ElMessage.success('新增成功')
    } else {
      await updateDept(editingDept.value.id, {
        name: editingDept.value.name,
        parentId: selectedParentId,
        sort: editingDept.value.sort,
      })
      ElMessage.success('修改成功')
    }
    showEdit.value = false
    await fetchTree()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该部门？', '提示', { type: 'warning' })
    await deleteDept(id)
    ElMessage.success('已删除')
    await fetchTree()
  } catch {
    /* 用户取消 */
  }
}

onMounted(() => fetchTree())
</script>

<template>
  <div class="dept-page">
    <AdminPageHeader title="部门管理" :crumbs="['首页', '组织与权限', '部门管理']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <button type="button" class="btn btn-primary" @click="openAdd(null)">新增部门</button>
      </div>

      <div class="admin-table-wrap" v-loading="loading">
        <el-table
          :data="deptTree"
          border
          class="admin-el-table"
          row-key="id"
          default-expand-all
          :tree-props="{ children: 'children' }"
          empty-text="暂无部门数据"
        >
          <el-table-column prop="name" label="部门名称" min-width="240" align="left" />
          <el-table-column label="上级部门" width="240" align="left">
            <template #default="{ row }">{{ getParentDeptName(row.parentId) || '—' }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="100" align="center" />
          <el-table-column label="操作" width="250" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="openAdd(row.id)">新增子部门</button>
                <button type="button" class="btn" @click="openEdit(row)">编辑</button>
                <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="showEdit" :title="isAdd ? '新增部门' : '编辑部门'" width="480px" destroy-on-close>
      <el-form label-width="80px" v-if="editingDept">
        <el-form-item label="上级部门">
          <el-cascader
            v-model="parentDeptPath"
            :options="cascaderOptions"
            :props="{ checkStrictly: true, emitPath: true }"
            placeholder="请选择上级部门"
            clearable
          />
        </el-form-item>
        <el-form-item label="部门名称"><el-input v-model="editingDept.name" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="editingDept.sort" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEdit = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveDept">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dept-page {
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

:deep(.el-input__wrapper),
:deep(.el-cascader) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
  border-color: var(--admin-border);
  width: 100%;
}

:deep(.el-cascader__input-wrap) {
  height: 100%;
}

:deep(.el-cascader__inner) {
  width: 100%;
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
</style>
