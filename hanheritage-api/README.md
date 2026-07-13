# 合川汉代崖墓博物馆 - 后端项目

基于 NestJS + TypeScript + MySQL 构建的合川汉代崖墓博物馆后端服务。

## 项目结构

```
src/
├── common/           # 公共模块
│   ├── decorators/   # 装饰器
│   ├── filters/      # 异常过滤器
│   ├── guards/       # 守卫
│   └── interceptors/ # 拦截器
├── modules/          # 业务模块
│   ├── ai/           # AI 服务
│   ├── auth/         # 认证模块
│   ├── cliff/        # 崖墓数据
│   ├── coffin/       # 棺椁数据
│   ├── dept/         # 部门管理
│   ├── log/          # 日志管理
│   ├── menu/         # 菜单管理
│   ├── monitor/      # 系统监控
│   ├── notice/       # 通知管理
│   ├── panorama/     # 全景数据
│   ├── post/         # 岗位管理
│   ├── resource/     # 资源管理
│   ├── role/         # 角色管理
│   └── user/         # 用户管理
├── prisma/           # Prisma ORM
├── app.module.ts     # 应用根模块
└── main.ts           # 应用入口
```

## 功能模块

### 核心业务
- **崖墓管理** - 崖墓数据的增删改查
- **棺椁管理** - 棺椁数据管理与地图展示
- **全景管理** - 全景漫游数据管理
- **AI 服务** - 智能分析与处理

### 系统管理
- **用户管理** - 用户信息管理
- **角色管理** - 角色权限配置
- **菜单管理** - 动态菜单配置
- **部门管理** - 部门组织结构
- **日志管理** - 操作日志与登录日志
- **系统监控** - 系统监控

## 技术栈

- NestJS 10+
- TypeScript
- MySQL 8.0+
- Prisma ORM
- JWT 认证
- Passport

## 快速开始

```bash
# 安装依赖
npm install

# 配置数据库连接
# 修改 .env 文件中的 DATABASE_URL

# 方式一：使用 Prisma Migration（推荐用于开发环境）
npx prisma migrate dev --name init

# 方式二：使用 SQL 脚本初始化（推荐用于生产环境）
# 执行 doc/03-系统设计/数据库初始化脚本.sql

# 导入 Demo 演示数据（二选一）
npm run db:seed
# 或: mysql -u root -p han_coffin_db < doc/03-系统设计/demo数据初始化脚本.sql

# 开发模式运行
npm run start:dev

# 生产构建
npm run build
npm run start:prod

# 运行测试
npm run test
npm run test:e2e
```

## 数据库配置

在 `.env` 文件中配置数据库连接：

```env
DATABASE_URL="mysql://root:password@localhost:3306/han_coffin_db"
JWT_SECRET="your-secret-key"
```

## 数据库字段命名规范

本项目采用分层命名策略：

| 层次 | 命名风格 | 示例 |
|------|----------|------|
| 代码层（Prisma 模型） | 驼峰命名（camelCase） | `createdAt`, `updateBy` |
| 数据库层 | 下划线命名（snake_case） | `create_time`, `update_by` |

## Prisma 与 MySQL ON UPDATE CURRENT_TIMESTAMP

> **注意**: Prisma 的 `@updatedAt` 注解不会自动添加 `ON UPDATE CURRENT_TIMESTAMP` 到 MySQL 列定义中。

如果需要数据库层面自动更新时间戳，执行完 Prisma Migration 后，需要手动执行以下 SQL 语句：

```sql
-- 更新所有 update_time 字段添加 ON UPDATE CURRENT_TIMESTAMP
ALTER TABLE geo_town MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_user MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_role MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_dept MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_menu MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_post MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_dict MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sys_notice MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE biz_cliff MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE biz_coffin MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE biz_panorama MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE biz_resource MODIFY COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

## 管理端访问

- **地址**: `http://localhost:5183/admin/login`
- **默认账号**: admin / admin

## API 接口

后端服务默认运行在 `http://localhost:3083`，API 前缀为 `/api/v1`。