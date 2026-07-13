# 合川汉代崖墓博物馆 - 前端项目

基于 Vue 3 + TypeScript + Vite 构建的合川汉代崖墓博物馆数字化展示平台。

## 项目结构

```
src/
├── api/           # API 接口封装
├── assets/        # 静态资源
├── data/          # 模拟数据
├── layouts/       # 布局组件
├── pages/         # 页面组件
│   ├── admin/     # 管理员后台
│   └── visitor/   # 游客展示
├── router/        # 路由配置
├── stores/        # 状态管理
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数
```

## 功能模块

### 游客端
- 首页展示
- 大耳朵崖墓展示
- 崖墓详情
- 棺椁展示与地图
- 全景漫游

### 管理端
- 用户管理
- 角色管理
- 菜单管理
- 部门管理
- 资源管理
- 日志管理
- 系统监控

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- SCSS

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式运行（连接真实后端API）
npm run dev

# 本地模式运行（使用Mock数据）
npm run local

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 环境模式说明

项目支持两种运行模式，通过环境变量 `VITE_LOCAL_MODE` 控制：

### Mock 模式（本地开发）
- 启动命令：`npm run local`
- 环境变量：`VITE_LOCAL_MODE=true`
- 使用本地模拟数据，不调用真实后端接口
- 适合前端独立开发和功能验证

### 真实 API 模式（开发/生产）
- 启动命令：`npm run dev` 或 `npm run build`
- 环境变量：`VITE_LOCAL_MODE=false`（默认）
- 调用真实后端 API 接口
- 需要配置后端服务地址

### 切换逻辑
在 `src/utils/mock.ts` 中实现了 API 代理机制：
- 当 `VITE_LOCAL_MODE=true` 时，使用 `mockApi` 提供模拟数据
- 当 `VITE_LOCAL_MODE=false` 时，使用 `realApi` 调用真实接口

## 常见问题与解决

### 样式/变量不生效
如果修改了 SCSS 变量或全局样式后页面没有更新，可能是 Vite 缓存导致：

```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite

# 清除后重新启动
npm run dev
# 或
npm run local
```

### 浏览器缓存问题
修改代码后页面未更新时：
- **Mac**: `Cmd + Shift + R` (硬刷新)
- **Windows/Linux**: `Ctrl + Shift + R`
- 或在浏览器开发者工具中勾选 "Disable cache" 并保持工具栏打开

### 构建失败
如果构建时出现类型错误：
```bash
# 先检查 TypeScript 类型
npm run typecheck

# 修复类型问题后再构建
npm run build
```