<script setup lang="ts">
import { ref, watch, onMounted, computed, reactive } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getUserPhone,
  getDeptTree,
  getRoleList,
  getPostList,
} from '@/api/system'
import type { User, Dept, Role, Post } from '@/data/admin-store'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const loading = ref(false)
const list = ref<User[]>([])
const total = ref(0)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

interface DeptNode extends Dept {
  children: DeptNode[]
}

const depts = ref<DeptNode[]>([])
const roles = ref<Role[]>([])
const posts = ref<Post[]>([])

async function fetchDepts() {
  try {
    const data = await getDeptTree()
    depts.value = data as unknown as DeptNode[]
  } catch {
    depts.value = []
  }
}

async function fetchRoles() {
  try {
    const res = await getRoleList({ pageSize: 999 })
    roles.value = res.items
  } catch {
    roles.value = []
  }
}

async function fetchPosts() {
  try {
    const res = await getPostList({ pageSize: 999 })
    posts.value = res.items
  } catch {
    posts.value = []
  }
}

function buildQueryParams(page = currentPage.value, size = pageSize.value) {
  return {
    page,
    pageSize: size,
    keyword: appliedKeyword.value.trim() || undefined,
  }
}

async function fetchList(page = currentPage.value) {
  loading.value = true
  try {
    const res = await getUserList(buildQueryParams(page, pageSize.value))
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
  pageSize.value = size
  currentPage.value = 1
  fetchList(1)
}

const showEdit = ref(false)
const editingUser = ref<User | null>(null)
const isAdd = ref(false)
const saving = ref(false)
const showFullPhone = ref(false)
const fullPhoneFetched = ref(false)
const formRef = ref<FormInstance>()

const formRules = reactive<FormRules>({
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择部门', trigger: 'change' }],
})

function openAdd() {
  isAdd.value = true
  editingUser.value = { id: '', realName: '', phone: '', deptId: '', roleIds: [], postIds: [], status: 'enabled' }
  showEdit.value = true
}

function openEdit(u: User) {
  isAdd.value = false
  editingUser.value = { ...u, roleIds: [...u.roleIds], postIds: [...u.postIds] }
  showFullPhone.value = false
  fullPhoneFetched.value = false
  showEdit.value = true
}

async function fetchFullPhone() {
  if (!editingUser.value || fullPhoneFetched.value) return
  try {
    const res = await getUserPhone(editingUser.value.id)
    editingUser.value.phone = res.phone
    fullPhoneFetched.value = true
    showFullPhone.value = true
  } catch {
    ElMessage.error('获取手机号失败')
  }
}

const displayPhone = computed(() => {
  if (!editingUser.value?.phone) return ''
  return editingUser.value.phone
})

async function saveUser() {
  if (!editingUser.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (isAdd.value) {
      await createUser(editingUser.value)
      ElMessage.success('新增成功')
    } else {
      await updateUser(editingUser.value.id, editingUser.value)
      ElMessage.success('保存成功')
    }
    showEdit.value = false
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  } finally {
    saving.value = false
  }
}

async function removeUser(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该用户？', '提示', { type: 'warning' })
    await deleteUser(id)
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

async function toggleStatus(u: User) {
  const newStatus = u.status === 'enabled' ? 'disabled' : 'enabled'
  try {
    await updateUser(u.id, { status: newStatus })
    u.status = newStatus
    ElMessage.success(newStatus === 'enabled' ? '已启用' : '已禁用')
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

onMounted(async () => {
  await fetchList()
  await Promise.all([fetchDepts(), fetchRoles(), fetchPosts()])
})
</script>

<template>
  <div class="user-page">
    <AdminPageHeader title="用户管理" :crumbs="['首页', '组织与权限', '用户管理']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <el-input
          v-model="draftKeyword"
          placeholder="姓名 / 手机号"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <div class="toolbar-spacer"></div>
        <button type="button" class="btn btn-primary" @click="openAdd">新增用户</button>
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
          <el-table-column prop="realName" label="姓名" min-width="100" align="left" />
          <el-table-column prop="phone" label="手机号" width="130" align="left" />
          <el-table-column label="部门" min-width="140" align="left">
            <template #default="{ row }">{{ row.deptName || '—' }}</template>
          </el-table-column>
          <el-table-column label="角色" min-width="140" align="left">
            <template #default="{ row }">{{ row.roleNames || '—' }}</template>
          </el-table-column>
          <el-table-column label="岗位" min-width="120" align="left">
            <template #default="{ row }">{{ row.postNames || '—' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <span :class="['status-tag', row.status === 'enabled' ? 'status-enabled' : 'status-disabled']">
                {{ row.status === 'enabled' ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="openEdit(row)">编辑</button>
                <button type="button" class="btn" :class="row.status === 'enabled' ? 'btn-warning' : 'btn-publish'" @click="toggleStatus(row)">
                  {{ row.status === 'enabled' ? '禁用' : '启用' }}
                </button>
                <button type="button" class="btn btn-danger" @click="removeUser(row.id)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="admin-pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="showEdit"
      :title="isAdd ? '新增用户' : '编辑用户'"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        v-if="editingUser"
        ref="formRef"
        :model="editingUser"
        :rules="formRules"
        label-width="80px"
        label-position="right"
        class="edit-form"
        @submit.prevent
      >
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="editingUser.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <div class="phone-input-wrap">
            <el-input
              :value="displayPhone"
              :disabled="!isAdd && !showFullPhone"
              placeholder="请输入手机号"
              @input="(val: string) => { editingUser!.phone = val }"
            />
            <button
              v-if="!isAdd && !showFullPhone && editingUser?.phone"
              type="button"
              class="btn btn-link"
              @click="fetchFullPhone"
            >
              显示完整号码
            </button>
          </div>
        </el-form-item>
        <el-form-item label="部门" prop="deptId">
          <el-tree-select
            v-model="editingUser.deptId"
            :data="depts"
            :props="{ label: 'name', children: 'children' }"
            value-key="id"
            placeholder="请选择部门"
            clearable
            class="form-select"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="editingUser.roleIds" class="form-perm-grid">
            <el-checkbox v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="岗位">
          <el-checkbox-group v-model="editingUser.postIds" class="form-perm-grid">
            <el-checkbox v-for="p in posts" :key="p.id" :label="p.name" :value="p.id" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editingUser.status">
            <el-radio value="enabled">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEdit = false">取消</button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveUser">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-page {
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

.btn-publish {
  background: #fff;
  border-color: #bbf7d0;
  color: #16a34a;

  &:hover {
    background: #dcfce7;
  }
}

.btn-warning {
  background: #fff;
  border-color: #fde68a;
  color: #d97706;

  &:hover {
    background: #fef9c3;
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

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.82rem;
}

.status-enabled {
  background: #dcfce7;
  color: #16a34a;
}

.status-disabled {
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
    padding: 18px;
    font-size: 0.9rem;
    max-height: calc(90dvh - 140px);
    overflow-y: auto;
  }

  .el-dialog__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px;
    border-top: 1px solid var(--admin-border);
    background: transparent;
  }
}

.form-select {
  width: 100%;
  max-width: 480px;
}

:deep(.el-input) {
  width: 100%;
  max-width: 480px;
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

:deep(.el-select) {
  max-width: 480px;
}

:deep(.el-select__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
  border-radius: 8px;
}

:deep(.el-tree-select) {
  max-width: 480px;
  --el-select-input-height: var(--admin-touch);
}

:deep(.el-tree-select .el-select__wrapper) {
  min-height: var(--admin-touch);
  height: var(--admin-touch);
}

.phone-input-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  max-width: 480px;

  :deep(.el-input) {
    flex: 1;
    max-width: none;
  }
}

.btn-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--admin-primary);
  text-decoration: underline;

  &:hover {
    background: transparent;
    color: var(--admin-primary-hover);
  }
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
</style>
