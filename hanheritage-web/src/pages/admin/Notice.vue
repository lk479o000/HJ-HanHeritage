<script setup lang="ts">
import { ref, watch, onMounted, reactive, onBeforeUnmount } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  publishNotice as publishNoticeApi,
  unpublishNotice as unpublishNoticeApi,
  fmtDate,
  type NoticeVo,
  type NoticeQuery,
} from '@/api/notice'
import { uploadResourceFile } from '@/api/resource'
import { isLocalMode } from '@/utils/mock'
import { depts, roles, scopeText } from '@/data/admin-store'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

const loading = ref(false)
const list = ref<NoticeVo[]>([])
const total = ref(0)

const draftKeyword = ref('')
const appliedKeyword = ref('')

const currentPage = ref(1)
const pageSize = ref(10)

const showEdit = ref(false)
const editingNotice = ref<NoticeVo | null>(null)
const isAdd = ref(false)
const isDraft = ref(false)

const formRef = ref<FormInstance>()
const formRules = reactive<FormRules>({
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
})

// 富文本编辑器实例
const editorRef = ref<IDomEditor | null>(null)
const editorHtml = ref('')

// 编辑器配置
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [],
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入公告内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/v1/resources/upload',
      fieldName: 'file',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/*'],
      meta: {
        folderId: 'notice-images',
        type: 'image',
      },
      metaWithUrl: false,
      withCredentials: true,
      timeout: 5 * 60 * 1000, // 5分钟
      // 自定义上传
      customUpload: async (file: File, insertFn: (url: string, alt?: string, href?: string) => void) => {
        try {
          // 使用已有的 uploadResourceFile 函数
          const res = await uploadResourceFile(file, 'notice-images', 'image')
          // 处理返回的资源，尝试获取图片 URL
          let imageUrl = ''
          if ('fileUrl' in res) {
            imageUrl = (res as any).fileUrl
          } else if ('url' in res) {
            imageUrl = (res as any).url
          } else if (isLocalMode) {
            // 本地模式下，创建一个临时的 blob URL 作为预览
            imageUrl = URL.createObjectURL(file)
          }
          
          if (imageUrl) {
            insertFn(imageUrl, file.name, imageUrl)
          } else {
            ElMessage.error('图片上传失败：未获取到图片地址')
          }
        } catch (err) {
          ElMessage.error('图片上传失败')
          console.error(err)
        }
      },
    },
  },
}

// 监听编辑器内容变化
function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

function handleChanged(editor: IDomEditor) {
  if (editingNotice.value) {
    editorHtml.value = editor.getHtml()
    editingNotice.value.contentHtml = editorHtml.value
    editingNotice.value.content = editor.getText()
  }
}

function buildQueryParams(page = currentPage.value): NoticeQuery {
  return {
    page,
    pageSize: pageSize.value,
    keyword: appliedKeyword.value.trim() || undefined,
  }
}

async function fetchList(page = currentPage.value) {
  loading.value = true
  try {
    const res = await getNotices(buildQueryParams(page))
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

function openAdd() {
  isAdd.value = true
  isDraft.value = true
  editingNotice.value = {
    id: '',
    title: '',
    content: '',
    contentHtml: '',
    type: 'notice',
    status: 'draft',
    scope: { type: 'all', ids: [] },
    publishedAt: null,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }
  editorHtml.value = ''
  showEdit.value = true
}

function openEdit(n: NoticeVo) {
  isAdd.value = false
  isDraft.value = n.status === 'draft'
  const scope = typeof n.scope === 'string'
    ? { type: n.scope, ids: [] }
    : { type: n.scope.type, ids: [...n.scope.ids] }
  editingNotice.value = { ...n, scope }
  editorHtml.value = n.contentHtml || ''
  showEdit.value = true
}

async function saveNotice() {
  if (!editingNotice.value) return
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  // 确保内容已同步
  if (editorRef.value) {
    editingNotice.value.contentHtml = editorRef.value.getHtml()
    editingNotice.value.content = editorRef.value.getText()
  }
  try {
    if (isAdd.value) {
      const data: Partial<NoticeVo> = {
        title: editingNotice.value.title,
        content: editingNotice.value.content,
        contentHtml: editingNotice.value.contentHtml,
        scope: editingNotice.value.scope,
        status: isDraft.value ? 'draft' : 'published',
      }
      await createNotice(data)
    } else {
      const data: Partial<NoticeVo> = {
        title: editingNotice.value.title,
        content: editingNotice.value.content,
        contentHtml: editingNotice.value.contentHtml,
        scope: editingNotice.value.scope,
      }
      if (isDraft.value) {
        data.status = 'draft'
      } else if (editingNotice.value.status === 'draft') {
        data.status = 'published'
      }
      await updateNotice(editingNotice.value.id, data)
    }
    showEdit.value = false
    ElMessage.success('保存成功')
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该条公告？', '提示', { type: 'warning' })
    await deleteNotice(id)
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

async function publishNotice(n: NoticeVo) {
  try {
    await publishNoticeApi(n.id)
    ElMessage.success('发布成功')
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

async function unpublishNotice(n: NoticeVo) {
  try {
    await unpublishNoticeApi(n.id)
    ElMessage.success('已撤回为草稿')
    await fetchList()
  } catch {
    /* 请求失败已由拦截器提示 */
  }
}

// 组件卸载时销毁编辑器
onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
})

watch(currentPage, (page, prev) => {
  if (page !== prev) fetchList(page)
})

watch(pageSize, () => {
  currentPage.value = 1
  fetchList(1)
})

onMounted(() => fetchList())
</script>

<template>
  <div class="notice-page">
    <AdminPageHeader title="通知公告" :crumbs="['首页', '系统配置', '通知公告']" />
    <div class="admin-card">
      <div class="admin-toolbar">
        <el-input
          v-model="draftKeyword"
          placeholder="搜索公告标题"
          clearable
          class="toolbar-search"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-primary" @click="onSearch">查询</button>
        <button type="button" class="btn" @click="onReset">重置</button>
        <button type="button" class="btn btn-primary" @click="openAdd">发布公告</button>
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
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip align="left" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <span :class="['notice-status', row.status === 'published' ? 'published' : 'draft']">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" width="160" align="center">
            <template #default="{ row }">{{ row.publishedAt ? dayjs(row.publishedAt).format('YYYY-MM-DD') : '-' }}</template>
          </el-table-column>
          <el-table-column label="可见范围" min-width="120" align="left">
            <template #default="{ row }">{{ scopeText(row.scope) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <div class="admin-table-actions">
                <button type="button" class="btn" @click="openEdit(row)">编辑</button>
                <button v-if="row.status === 'draft'" type="button" class="btn btn-publish" @click="publishNotice(row)">发布</button>
                <button v-else type="button" class="btn btn-warning" @click="unpublishNotice(row)">撤回</button>
                <button type="button" class="btn btn-danger" @click="handleDelete(row.id)">删除</button>
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
        />
      </div>
    </div>

    <el-dialog
      v-model="showEdit"
      :title="isAdd ? '发布公告' : '编辑公告'"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        v-if="editingNotice"
        ref="formRef"
        :model="editingNotice"
        :rules="formRules"
        label-width="80px"
        label-position="right"
        class="edit-form"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="editingNotice.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="正文">
          <div class="notice-editor-wrap">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
              class="notice-editor-toolbar"
            />
            <Editor
              :defaultConfig="editorConfig"
              v-model="editorHtml"
              mode="default"
              @onCreated="handleCreated"
              @onChanged="handleChanged"
              class="notice-editor"
            />
          </div>
        </el-form-item>
        <el-form-item label="可见范围">
          <div class="notice-scope">
            <div class="notice-scope-row">
              <label class="notice-scope-opt"><input type="radio" v-model="editingNotice.scope.type" value="all" /> 全部用户</label>
              <label class="notice-scope-opt"><input type="radio" v-model="editingNotice.scope.type" value="dept" /> 指定部门</label>
              <label class="notice-scope-opt"><input type="radio" v-model="editingNotice.scope.type" value="role" /> 指定角色</label>
            </div>
            <div class="notice-scope-pick" v-if="editingNotice.scope.type === 'dept'">
              <div class="notice-scope-pick-title">选择部门（可多选）</div>
              <div class="notice-scope-pills">
                <label v-for="d in depts" :key="d.id" class="notice-pill">
                  <input type="checkbox" :value="d.id" v-model="editingNotice.scope.ids" /> {{ d.name }}
                </label>
              </div>
            </div>
            <div class="notice-scope-pick" v-if="editingNotice.scope.type === 'role'">
              <div class="notice-scope-pick-title">选择角色（可多选）</div>
              <div class="notice-scope-pills">
                <label v-for="r in roles" :key="r.id" class="notice-pill">
                  <input type="checkbox" :value="r.id" v-model="editingNotice.scope.ids" /> {{ r.name }}
                </label>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <label class="notice-draft-label"><input type="checkbox" v-model="isDraft" /> 保存为草稿</label>
        </el-form-item>
      </el-form>
      <template #footer>
        <button type="button" class="btn" @click="showEdit = false">取消</button>
        <button type="button" class="btn btn-primary" @click="saveNotice">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss">
@import '@wangeditor/editor/dist/css/style.css';
</style>

<style scoped lang="scss">

.notice-page {
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

.notice-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.82rem;

  &.published {
    background: #dcfce7;
    color: #16a34a;
  }

  &.draft {
    background: #f1f5f9;
    color: #64748b;
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
  width: 720px !important;
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

.notice-draft-label {
  font-size: 0.88rem;
  color: var(--admin-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.notice-editor-wrap {
  width: 100%;
  max-width: 100%;
}

.notice-editor-toolbar {
  border: 1px solid var(--admin-border);
  border-radius: 10px 10px 0 0;
  background: #f8fafc;

  :deep(.w-e-bar) {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    border: none !important;
    border-bottom: 1px solid var(--admin-border) !important;
    padding: 4px 8px !important;
    gap: 0 !important;
  }

  :deep(.w-e-bar-item) {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: auto !important;
    min-width: 32px !important;
    height: 32px !important;
    padding: 0 4px !important;
    margin: 1px 0 !important;
    border-radius: 4px;
    font-size: 14px !important;
    line-height: 1 !important;
  }

  :deep(.w-e-bar-item button) {
    width: auto !important;
    height: 28px !important;
    padding: 0 4px !important;
    font-size: 14px !important;
    line-height: 28px !important;
  }

  :deep(.w-e-bar-divider) {
    display: inline-block !important;
    width: 1px !important;
    height: 16px !important;
    margin: 0 6px !important;
  }

  :deep(.w-e-bar-item-active) {
    background: #e8f0fe !important;
  }
}

.notice-editor {
  border: 1px solid var(--admin-border);
  border-top: none;
  border-radius: 0 0 10px 10px;
  background: #fff;
  min-height: 300px;

  // wangEditor 编辑区自定义样式
  :deep(.w-e-text-container) {
    border: none !important;
    min-height: 300px;
  }

  :deep(.w-e-scroll) {
    padding: 12px 14px;
  }

  :deep(.w-e-text) {
    color: var(--admin-text);
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

.notice-scope {
  width: 100%;
  max-width: 820px;
}

.notice-scope-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.notice-scope-opt {
  font-size: 0.9rem;
  color: var(--admin-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.notice-scope-pick {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: #f8fafc;
}

.notice-scope-pick-title {
  font-size: 0.82rem;
  color: var(--admin-muted);
  font-weight: 600;
  margin-bottom: 8px;
}

.notice-scope-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.notice-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--admin-border);
  background: #fff;
  font-size: 0.84rem;
  color: var(--admin-text);
  cursor: pointer;
  transition: all 0.15s;

  &:has(input:checked) {
    border-color: var(--admin-primary);
    background: rgba(37, 99, 235, 0.08);
    color: var(--admin-primary);
  }

  input {
    display: none;
  }
}
</style>
