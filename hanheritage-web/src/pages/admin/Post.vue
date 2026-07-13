<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getPostList, createPost, updatePost, deletePost, type Post } from '@/api/system'
import { permissionMenus } from '@/data/admin-store'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const allPosts = ref<Post[]>([])
const editingPost = ref<Partial<Post> | null>(null)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const showEdit = ref(false)
const isAdd = ref(false)

interface TreeRow {
  row: Post
  level: number
}

interface TreeNode extends Post {
  children: TreeNode[]
}

function buildTree(items: Post[]): TreeNode[] {
  const byParent: Record<string, Post[]> = {}
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

function treeRows(items: Post[]): TreeRow[] {
  const byParent: Record<string, Post[]> = {}
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
  let cur = allPosts.value.find(x => x.id === maybeDescId)
  while (cur && cur.parentId) {
    if (cur.parentId === ancestorId) return true
    cur = allPosts.value.find(x => x.id === cur!.parentId)
  }
  return false
}

function hasChildPosts(id: string): boolean {
  return allPosts.value.some(p => p.parentId === id)
}

const list = computed<TreeNode[]>(() => {
  let filtered = [...allPosts.value]
  const kw = appliedKeyword.value.trim().toLowerCase()
  if (kw) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(kw)
    )
    const matchingIds = new Set(filtered.map(p => p.id))
    const includeIds = new Set<string>()
    filtered.forEach(p => {
      let current: Post | undefined = p
      while (current) {
        includeIds.add(current.id)
        current = allPosts.value.find(x => x.id === current!.parentId)
      }
    })
    filtered = allPosts.value.filter(p => includeIds.has(p.id))
  }
  return buildTree(filtered)
})

function getPermSummary(ids: string[]): string {
  if (!ids?.length) return '—'
  return ids.map(id => permissionMenus.find(p => p.id === id)?.label ?? id).join('、')
}

function getParentPostName(parentId: string | null): string {
  if (!parentId) return ''
  const parent = allPosts.value.find(p => p.id === parentId)
  return parent?.name || ''
}

function getParentPostOptions(excludeId?: string): TreeRow[] {
  return treeRows(allPosts.value).filter(item => {
    if (!excludeId) return true
    return item.row.id !== excludeId && !isDescendant(item.row.id, excludeId)
  })
}

function getOptionLabel(item: TreeRow): string {
  const prefix = '\u3000'.repeat(item.level)
  return prefix + item.row.name
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
  editingPost.value = { name: '', parentId: null, sort: 1, remark: '', permissionIds: [] }
  showEdit.value = true
}

function openEdit(p: Post) {
  isAdd.value = false
  editingPost.value = { ...p, permissionIds: [...p.permissionIds] }
  showEdit.value = true
}

async function savePost() {
  if (!editingPost.value) return
  
  if (!isAdd.value && editingPost.value.parentId && isDescendant(editingPost.value.parentId, editingPost.value.id!)) {
    ElMessage.warning('不能将上级设为自己的下级')
    return
  }
  
  try {
    if (isAdd.value) {
      await createPost(editingPost.value)
      ElMessage.success('新增成功')
    } else {
      await updatePost(editingPost.value.id!, editingPost.value)
      ElMessage.success('保存成功')
    }
    showEdit.value = false
    await fetchAllPosts()
  } catch {
    /* error handled by interceptor */
  }
}

async function handleDelete(id: string) {
  if (hasChildPosts(id)) {
    ElMessage.warning('请先删除或调整子岗位')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定删除该岗位？', '提示', { type: 'warning' })
    await deletePost(id)
    ElMessage.success('已删除')
    await fetchAllPosts()
  } catch {
    /* user cancel */
  }
}

function togglePerm(permId: string) {
  if (!editingPost.value) return
  const ids = editingPost.value.permissionIds || []
  const idx = ids.indexOf(permId)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(permId)
}

async function fetchAllPosts() {
  loading.value = true
  try {
    const res = await getPostList({ pageSize: 999 })
    allPosts.value = res.items
  } catch {
    allPosts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllPosts()
})
</script>

<template>
  <div class="post-page">
    <AdminPageHeader title="岗位管理" :crumbs="['首页', '组织与权限', '岗位管理']" />
    <div class="admin-card">
      <p class="org-hint">列表按层级缩进；删除前需解除子岗位关联。</p>
      <div class="admin-toolbar">
        <el-input
          v-model="draftKeyword"
          placeholder="岗位名称"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <button type="button" class="btn btn-primary" @click="openAdd">新增岗位</button>
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
          <el-table-column prop="name" label="岗位名称" min-width="180" align="left" />
          <el-table-column label="上级岗位" width="120" align="left">
            <template #default="{ row }">{{ getParentPostName(row.parentId) || '—' }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" align="right" />
          <el-table-column label="权限摘要" min-width="240" align="left">
            <template #default="{ row }">
              <span class="perm-summary">{{ getPermSummary(row.permissionIds) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="openEdit(row)">编辑</button>
                <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="showEdit" :title="isAdd ? '新增岗位' : '编辑岗位'" width="560px" destroy-on-close>
      <el-form label-width="100px" v-if="editingPost">
        <el-form-item label="岗位名称"><el-input v-model="editingPost.name" /></el-form-item>
        <el-form-item label="上级岗位">
          <el-select v-model="editingPost.parentId" placeholder="无上级岗位" clearable>
            <el-option value="" label="（顶级岗位）" />
            <el-option v-for="item in getParentPostOptions(editingPost?.id)" :key="item.row.id" :label="getOptionLabel(item)" :value="item.row.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="editingPost.sort" :min="1" /></el-form-item>
        <el-form-item label="权限配置">
          <el-checkbox-group v-model="editingPost.permissionIds" class="form-perm-grid">
            <el-checkbox v-for="p in permissionMenus" :key="p.id" :label="p.label" :value="p.id" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="editingPost.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEdit = false">取消</button>
        <button type="button" class="btn btn-primary" @click="savePost">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.post-page {
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

.perm-summary {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.4;
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

.edit-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
    display: flex;
    align-items: center;

    .el-form-item__label {
      font-size: 0.88rem;
      color: var(--admin-muted);
      white-space: nowrap;
    }

    .el-form-item__content {
      font-size: 0.9rem;
      flex: 1;
    }
  }
}

.form-select {
  width: 100%;
  max-width: 480px;
}

.form-perm-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 14px;
  max-height: 180px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: #f8fafc;
  width: 100%;
  max-width: 480px;

  :deep(.el-checkbox) {
    font-size: 0.86rem;
    line-height: 1.35;
  }

  :deep(.el-checkbox__label) {
    padding-left: 8px;
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

:deep(.el-input-number) {
  max-width: 200px;
}

:deep(.el-input-number__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
}
</style>
