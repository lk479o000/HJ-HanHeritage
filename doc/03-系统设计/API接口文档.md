# 合江汉代画像石棺数字化保护与展示利用项目 — API接口文档

**文档编号**：API-2026-001

**版本**：v1.0

**状态**：草稿

**创建日期**：2026-05-21

**最后更新**：2026-05-21

---

## 文档修订历史

| 版本号 | 日期 | 修订人 | 修订内容 |
|--------|------|--------|----------|
| v1.0 | 2026-05-21 | - | 初始版本，定义所有API接口规范 |

---

## 目录

1. [概述](#1-概述)
2. [接口规范](#2-接口规范)
3. [认证模块](#3-认证模块)
4. [用户管理模块](#4-用户管理模块)
5. [角色权限模块](#5-角色权限模块)
6. [组织架构模块](#6-组织架构模块)
7. [崖墓管理模块](#7-崖墓管理模块)
8. [石棺管理模块](#8-石棺管理模块)
9. [全景管理模块](#9-全景管理模块)
10. [资源管理模块](#10-资源管理模块)
11. [系统配置模块](#11-系统配置模块)
12. [日志管理模块](#12-日志管理模块)
13. [运维监控模块](#13-运维监控模块)
14. [AI模块](#14-ai模块)
15. [游客端公开接口与埋点](#15-游客端公开接口与埋点)
16. [错误码参考](#16-错误码参考)

---

## 1. 概述

### 1.1 文档目的

本文档定义合江汉代画像石棺数字化保护与展示利用项目的所有API接口规范，包括接口路径、请求方式、请求参数、响应格式、错误处理等内容。本文档是前后端开发的契约依据，所有接口需严格遵循本文档定义的规范进行实现和调用。

> **实现状态（2026-11-06）**：第 7–9 章（崖墓、石棺、全景）、第 12 章（日志）、第 14 章（AI，含占位说明）、第 15 章（游客端公开接口与埋点）已按当前代码更新。其余章节（用户、角色、组织、资源、系统配置、运维监控）的部分字段与示例仍为早期设计稿，实际以 `hanheritage-api/src/modules/**/*.controller.ts` 为准；接口响应统一由 `TransformInterceptor` 包装为 `{ code, message, data }`。

### 1.2 接口基础信息

接口基础信息如下。

- 接口根路径：http://api.example.com/api/v1
- 数据格式：JSON
- 字符编码：UTF-8
- 认证方式：Bearer Token（JWT）
- 接口版本：通过URL路径管理，/api/v1/表示第一版接口

### 1.3 公共请求头

所有需要认证的接口需要在请求Header中携带以下信息。

| Header名称 | 必填 | 说明 |
|------------|------|------|
| Authorization | 是 | Bearer {token}，登录成功后获取的JWT令牌 |
| Content-Type | 是 | application/json，发送JSON数据时 |
| Accept | 否 | application/json，期望返回JSON格式 |

### 1.4 公共响应格式

所有接口统一响应格式如下。

成功响应示例如下。

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应示例如下。

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

错误响应示例如下。

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

---

## 2. 接口规范

### 2.1 路径规范

接口路径采用RESTful风格，遵循以下规范。路径使用小写字母和下划线，采用资源名词复数形式。路径参数使用冒号标识，如: id表示ID参数。动作资源使用子路径表达，如/users/:id/reset-password表示重置密码。

### 2.2 方法规范

HTTP方法定义操作类型，如下所示。

GET方法用于查询数据，幂等操作，不修改服务器数据。POST方法用于新增数据，每次请求创建新资源。PUT方法用于完整更新数据，幂等操作，替换整个资源。PATCH方法用于部分更新数据，仅更新指定字段。DELETE方法用于删除数据，幂等操作。

### 2.3 分页参数

支持分页的查询接口使用以下参数。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | integer | 否 | 1 | 当前页码，从1开始 |
| pageSize | integer | 否 | 10 | 每页记录数，最大100 |
| orderBy | string | 否 | createTime | 排序字段 |
| orderDirection | string | 否 | desc | 排序方向，asc或desc |

### 2.4 时间格式

所有时间字段采用ISO 8601格式，示例为2026-05-21T10:30:00+08:00。日期字段采用YYYY-MM-DD格式，示例为2026-05-21。时间戳字段采用Unix时间戳格式，示例为1716258600。

---

## 3. 认证模块

### 3.1 用户登录

用户登录系统，获取访问令牌。

**接口信息**

- 接口路径：POST /auth/login
- 认证要求：否
- 接口描述：用户登录接口，输入账号密码进行身份验证

**请求参数**

```json
{
  "account": "admin",
  "password": "xxx"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| account | string | 是 | 账号 |
| password | string | 是 | 密码（已加密传输） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzE2MjU4NjAwfQ.xxx",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "user": {
      "id": 1,
      "account": "admin",
      "realName": "系统管理员",
      "avatar": "https://xxx.com/avatar.png",
      "roles": ["admin"],
      "permissions": ["*:*:*"]
    }
  }
}
```

### 3.2 用户登出

用户退出登录，使当前令牌失效。

**接口信息**

- 接口路径：POST /auth/logout
- 认证要求：是
- 接口描述：用户登出接口，使当前令牌失效

**请求参数**

无

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 3.3 刷新令牌

刷新访问令牌，延长会话有效期。

**接口信息**

- 接口路径：POST /auth/refresh
- 认证要求：是
- 接口描述：刷新访问令牌

**请求参数**

无，当前令牌从Header中获取

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzE2MjU4ODAwfQ.xxx",
    "expiresIn": 7200
  }
}
```

### 3.4 获取用户信息

获取当前登录用户的详细信息。

**接口信息**

- 接口路径：GET /auth/userInfo
- 认证要求：是
- 接口描述：获取当前登录用户信息

**请求参数**

无

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "account": "admin",
    "realName": "系统管理员",
    "email": "admin@example.com",
    "mobile": "13800138000",
    "avatar": "https://xxx.com/avatar.png",
    "deptId": 1,
    "deptName": "技术部",
    "roles": ["admin"],
    "roleNames": ["超级管理员"],
    "permissions": ["*:*:*"],
    "lastLoginTime": "2026-05-21T10:30:00+08:00",
    "lastLoginIp": "192.168.1.100"
  }
}
```

### 3.5 修改密码

修改当前用户的登录密码。

**接口信息**

- 接口路径：PUT /auth/password
- 认证要求：是
- 接口描述：修改当前用户密码

**请求参数**

```json
{
  "oldPassword": "xxx",
  "newPassword": "xxx"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码，需满足复杂度要求 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 4. 用户管理模块

### 4.1 查询用户列表

分页查询用户列表。

**接口信息**

- 接口路径：GET /users
- 认证要求：是
- 接口描述：分页查询用户列表，支持多条件筛选

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| account | string | 否 | 账号（模糊匹配） |
| realName | string | 否 | 姓名（模糊匹配） |
| mobile | string | 否 | 手机号（精确匹配） |
| deptId | integer | 否 | 部门ID |
| status | integer | 否 | 状态：0停用 1启用 |
| page | integer | 否 | 页码，默认1 |
| pageSize | integer | 否 | 每页数量，默认10 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "account": "admin",
        "realName": "系统管理员",
        "mobile": "13800138000",
        "email": "admin@example.com",
        "avatar": "https://xxx.com/avatar.png",
        "deptId": 1,
        "deptName": "技术部",
        "status": 1,
        "createTime": "2026-01-01 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4.2 查询用户详情

根据ID查询用户详细信息。

**接口信息**

- 接口路径：GET /users/:id
- 认证要求：是
- 接口描述：查询用户详情

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 用户ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "account": "admin",
    "realName": "系统管理员",
    "mobile": "13800138000",
    "email": "admin@example.com",
    "avatar": "https://xxx.com/avatar.png",
    "deptId": 1,
    "deptName": "技术部",
    "roleIds": [1],
    "roleNames": ["超级管理员"],
    "status": 1,
    "createBy": "system",
    "createTime": "2026-01-01 10:00:00",
    "updateBy": "admin",
    "updateTime": "2026-05-21 10:00:00"
  }
}
```

### 4.3 新增用户

创建新的用户账号。

**接口信息**

- 接口路径：POST /users
- 认证要求：是
- 接口描述：新增用户账号

**请求参数**

```json
{
  "account": "newuser",
  "realName": "新用户",
  "password": "xxx",
  "mobile": "13800138001",
  "email": "newuser@example.com",
  "deptId": 1,
  "roleIds": [2],
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| account | string | 是 | 账号，4-20位字母数字 |
| realName | string | 是 | 姓名，2-30位 |
| password | string | 是 | 密码，8-20位，需包含大小写字母和数字 |
| mobile | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| deptId | integer | 是 | 部门ID |
| roleIds | array | 是 | 角色ID数组，至少选择一个角色 |
| status | integer | 否 | 状态，默认1启用 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10
  }
}
```

### 4.4 修改用户

更新用户信息。

**接口信息**

- 接口路径：PUT /users/:id
- 认证要求：是
- 接口描述：修改用户信息

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 用户ID |

**请求参数**

```json
{
  "realName": "管理员",
  "mobile": "13800138000",
  "email": "admin@example.com",
  "deptId": 1,
  "roleIds": [1, 2],
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| realName | string | 是 | 姓名 |
| mobile | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| deptId | integer | 是 | 部门ID |
| roleIds | array | 是 | 角色ID数组 |
| status | integer | 否 | 状态 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 4.5 删除用户

删除用户账号（软删除）。

**接口信息**

- 接口路径：DELETE /users/:id
- 认证要求：是
- 接口描述：删除用户账号

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 用户ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 4.6 修改用户状态

启用或停用用户账号。

**接口信息**

- 接口路径：PUT /users/:id/status
- 认证要求：是
- 接口描述：修改用户状态

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 用户ID |

**请求参数**

```json
{
  "status": 0
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | integer | 是 | 状态：0停用 1启用 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 5. 角色权限模块

### 5.1 查询角色列表

分页查询角色列表。

**接口信息**

- 接口路径：GET /roles
- 认证要求：是
- 接口描述：分页查询角色列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleName | string | 否 | 角色名称（模糊匹配） |
| status | integer | 否 | 状态 |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "roleName": "超级管理员",
        "roleKey": "admin",
        "dataScope": 1,
        "status": 1,
        "createTime": "2026-01-01 10:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10
  }
}
```

### 5.2 查询角色详情

根据ID查询角色详细信息，包括权限配置。

**接口信息**

- 接口路径：GET /roles/:id
- 认证要求：是
- 接口描述：查询角色详情

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 角色ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "roleName": "超级管理员",
    "roleKey": "admin",
    "roleSort": 1,
    "dataScope": 1,
    "dataScopeName": "全部数据",
    "status": 1,
    "menuIds": [1, 2, 3, 4, 5],
    "deptIds": [],
    "createTime": "2026-01-01 10:00:00"
  }
}
```

### 5.3 新增角色

创建新的角色。

**接口信息**

- 接口路径：POST /roles
- 认证要求：是
- 接口描述：新增角色

**请求参数**

```json
{
  "roleName": "文物管理员",
  "roleKey": "cultural_admin",
  "roleSort": 2,
  "dataScope": 2,
  "status": 1,
  "menuIds": [1, 2, 3],
  "remark": "负责文物数据管理"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleName | string | 是 | 角色名称 |
| roleKey | string | 是 | 角色标识，唯一 |
| roleSort | integer | 否 | 显示顺序 |
| dataScope | integer | 否 | 数据范围：1全部 2本部门 3本部门及下级 4仅本人 |
| status | integer | 否 | 状态 |
| menuIds | array | 是 | 菜单权限ID数组 |
| deptIds | array | 否 | 数据权限部门ID数组（当dataScope为2或3时） |
| remark | string | 否 | 备注 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10
  }
}
```

### 5.4 修改角色

更新角色信息。

**接口信息**

- 接口路径：PUT /roles/:id
- 认证要求：是
- 接口描述：修改角色

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 角色ID |

**请求参数**

```json
{
  "roleName": "文物管理员",
  "roleSort": 2,
  "dataScope": 2,
  "status": 1,
  "menuIds": [1, 2, 3],
  "remark": "负责文物数据管理"
}
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 5.5 删除角色

删除角色。

**接口信息**

- 接口路径：DELETE /roles/:id
- 认证要求：是
- 接口描述：删除角色

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 角色ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 5.6 查询权限菜单树

获取所有菜单树，用于角色权限配置。

**接口信息**

- 接口路径：GET /menus/tree
- 认证要求：是
- 接口描述：获取菜单权限树

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "menuName": "系统管理",
      "parentId": 0,
      "children": [
        {
          "id": 2,
          "menuName": "用户管理",
          "parentId": 1
        },
        {
          "id": 3,
          "menuName": "角色管理",
          "parentId": 1
        }
      ]
    }
  ]
}
```

---

## 6. 组织架构模块

### 6.1 查询部门树

获取部门树形结构。

**接口信息**

- 接口路径：GET /depts/tree
- 认证要求：是
- 接口描述：获取部门树

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "deptName": "合江县文物局",
      "parentId": 0,
      "children": [
        {
          "id": 2,
          "deptName": "技术部",
          "parentId": 1
        }
      ]
    }
  ]
}
```

### 6.2 查询部门详情

根据ID查询部门详情。

**接口信息**

- 接口路径：GET /depts/:id
- 认证要求：是
- 接口描述：查询部门详情

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 部门ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "deptName": "合江县文物局",
    "parentId": 0,
    "leader": "张三",
    "phone": "0830-xxxxxxx",
    "email": "admin@hejiang.gov.cn",
    "sort": 1,
    "status": 1,
    "createTime": "2026-01-01 10:00:00"
  }
}
```

### 6.3 新增部门

创建新的部门。

**接口信息**

- 接口路径：POST /depts
- 认证要求：是
- 接口描述：新增部门

**请求参数**

```json
{
  "deptName": "保护研究部",
  "parentId": 1,
  "leader": "李四",
  "phone": "0830-xxxxxxx",
  "email": "research@hejiang.gov.cn",
  "sort": 2,
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deptName | string | 是 | 部门名称 |
| parentId | integer | 否 | 上级部门ID，根部门为0 |
| leader | string | 否 | 负责人 |
| phone | string | 否 | 联系电话 |
| email | string | 否 | 邮箱 |
| sort | integer | 否 | 显示顺序 |
| status | integer | 否 | 状态 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10
  }
}
```

### 6.4 修改部门

更新部门信息。

**接口信息**

- 接口路径：PUT /depts/:id
- 认证要求：是
- 接口描述：修改部门

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 部门ID |

**请求参数**

```json
{
  "deptName": "保护研究部",
  "parentId": 1,
  "leader": "李四",
  "phone": "0830-xxxxxxx",
  "sort": 2,
  "status": 1
}
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 6.5 删除部门

删除部门。

**接口信息**

- 接口路径：DELETE /depts/:id
- 认证要求：是
- 接口描述：删除部门

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 部门ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 7. 崖墓管理模块

> 说明：`/cliffs` 系列为后台管理接口，除游客端公开接口外均需携带 JWT。游客端请使用第 15 章 `/visitor/*` 接口。

### 7.1 查询崖墓列表

**接口信息**

- 接口路径：GET /cliffs
- 认证要求：是
- 接口描述：分页查询崖墓群列表（仅返回未删除数据）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 编码/名称/地址/乡镇模糊匹配 |
| level | string | 否 | 保护级别精确匹配 |
| town | string | 否 | 所属乡镇精确匹配 |
| status | integer | 否 | 状态：0下线 1上线 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "code": "CM-01",
        "name": "洞溪崖墓群",
        "lng": 105.83123,
        "lat": 28.45234,
        "area": 1500,
        "town": "合江镇",
        "address": "合江镇洞溪村",
        "protectionUnitName": "洞溪崖墓群",
        "composition": "崖墓群",
        "level": "省级文物保护单位",
        "category": "崖墓",
        "dynasty": "东汉",
        "mapLeft": 30.1,
        "mapTop": 48.6,
        "featured": 1,
        "viewCount": 12,
        "coverImage": "/uploads/cliff/xxx.png",
        "modelUrl": "/uploads/model/xxx.glb",
        "images": [{ "id": "1", "imageUrl": "/uploads/cliff/xxx.png", "imageType": "photo", "sort": 0 }],
        "entrances": [{ "id": "1", "x": 10.5, "y": 20.3, "z": 5.8, "direction": "东", "intro": "主墓口" }],
        "coffins": [{ "id": "1", "code": "CF-01", "name": "1号石棺" }],
        "status": 1,
        "delFlag": 0
      }
    ],
    "total": 13,
    "page": 1,
    "pageSize": 10
  }
}
```

### 7.2 查询崖墓详情

**接口信息**

- 接口路径：GET /cliffs/:id
- 认证要求：是
- 接口描述：查询崖墓群详情，含墓口、未删除石棺、图片列表

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 崖墓ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "1",
    "code": "CM-01",
    "name": "洞溪崖墓群",
    "description": "……",
    "coverImage": "/uploads/cliff/xxx.png",
    "modelUrl": null,
    "mapLeft": 30.1,
    "mapTop": 48.6,
    "viewCount": 12,
    "images": [],
    "entrances": [],
    "coffins": [],
    "status": 1
  }
}
```

### 7.3 新增崖墓

**接口信息**

- 接口路径：POST /cliffs
- 认证要求：是
- 接口描述：新增崖墓群；`modelUrl` 会先校验可达性，不可达返回 400

**请求参数**

```json
{
  "code": "CM-14",
  "name": "福宝崖墓群",
  "lng": 105.84234,
  "lat": 28.48321,
  "area": 1200,
  "town": "福宝镇",
  "address": "福宝镇某村",
  "protectionUnitName": "福宝崖墓群",
  "composition": "崖墓群",
  "level": "县级文物保护单位",
  "category": "崖墓",
  "dynasty": "东汉",
  "description": "福宝崖墓群位于福宝镇……",
  "coverImage": "/uploads/cliff/xxx.png",
  "modelUrl": "/uploads/model/xxx.glb",
  "images": [{ "imageUrl": "/uploads/cliff/xxx.png", "imageType": "photo", "sort": 0 }],
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 否 | 编码，缺省自动生成 |
| name | string | 是 | 崖墓名称 |
| lng/lat | number | 否 | 经纬度 |
| area | number | 否 | 面积（平方米） |
| town/address/protectionUnitName/composition | string | 否 | 乡镇、地址、保护单位、构成 |
| level/category/dynasty | string | 否 | 保护级别、类别、年代 |
| description | string | 否 | 详细介绍 |
| coverImage | string | 否 | 封面图地址 |
| modelUrl | string | 否 | 三维模型地址（站内路径或 http(s)） |
| images | array | 否 | 图片列表，字段 `imageUrl/imageType/sort` |
| status | integer | 否 | 状态，默认 1 |

> 当前新增/修改接口未接收 `mapLeft/mapTop/featured`，这两项由初始化数据或数据库维护，后台暂无编辑入口。

**响应示例**

```json
{ "code": 200, "message": "success", "data": { "id": "14", "code": "CM-14" } }
```

### 7.4 修改崖墓

**接口信息**

- 接口路径：PUT /cliffs/:id
- 认证要求：是
- 接口描述：修改崖墓群；传入 `images` 时整体替换图片列表

**请求参数**：同 7.3。`modelUrl` 同样会校验可达性。

**响应示例**：返回修改后的崖墓详情，结构同 7.2。

### 7.5 删除崖墓

**接口信息**

- 接口路径：DELETE /cliffs/:id
- 认证要求：是
- 接口描述：逻辑删除（`delFlag=1`），游客端随即不可见

**响应示例**

```json
{ "code": 200, "message": "success", "data": null }
```

### 7.6 查询墓口列表

**接口信息**

- 接口路径：GET /cliffs/entrances
- 认证要求：是
- 接口描述：分页查询全部墓口点位，可通过 `page/pageSize` 分页

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "cliffId": "1",
        "x": 10.5,
        "y": 20.3,
        "z": 5.8,
        "direction": "东",
        "intro": "主墓口"
      }
    ],
    "total": 1
  }
}
```

### 7.7 新增 / 修改 / 删除墓口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /cliffs/:id/entrances | 为指定崖墓新增墓口 |
| PUT | /cliffs/entrances/:id | 修改墓口 |
| DELETE | /cliffs/entrances/:id | 删除墓口 |
| DELETE | /cliffs/:cliffId/entrances/:entranceId | 按崖墓与墓口双 ID 删除 |

**请求参数**

```json
{ "x": 10.5, "y": 20.3, "z": 5.8, "direction": "东", "intro": "主墓口" }
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| x / y / z | number | 否 | 三维坐标 |
| direction | string | 否 | 朝向 |
| intro | string | 否 | 简介 |

### 7.8 校验模型地址

**接口信息**

- 接口路径：GET /cliffs/model/check?url=...
- 认证要求：是
- 接口描述：后台填写模型地址后即时校验。站内 `/` 路径检查 `uploads/` 与 `web/public/` 物理文件；`http(s)` 地址按 HEAD → GET Range 探测，超时 5 秒

**响应示例**

```json
{ "code": 200, "message": "success", "data": { "reachable": true, "message": "模型文件存在" } }
```

失败时 `reachable=false` 并返回原因（如“模型文件不存在，请检查路径”）；新增/修改崖墓时服务端会再次校验并直接返回 400。

---

## 8. 石棺管理模块

> 说明：`/coffins` 为后台管理接口，需携带 JWT；游客端请使用 `/visitor/coffins`。

### 8.1 查询石棺列表

**接口信息**

- 接口路径：GET /coffins
- 认证要求：是
- 接口描述：分页查询未删除石棺，含关联崖墓、图片与模型

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 编码/名称/年代/级别/质地/墓群等模糊匹配 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "code": "CF-01",
        "name": "1号石棺",
        "cliffId": "1",
        "cliff": { "id": "1", "code": "CM-01", "name": "洞溪崖墓群" },
        "dynasty": "东汉",
        "grade": "一级",
        "dimensions": "2.4×0.7×0.8m",
        "texture": "红砂石",
        "description": "……",
        "thumbnail": "/uploads/coffin/xxx.png",
        "mapLeft": null,
        "mapTop": null,
        "viewCount": 3,
        "images": [{ "id": "1", "imageUrl": "/uploads/coffin/xxx.png", "imageType": "ortho", "sort": 0 }],
        "models": [{ "id": "1", "modelUrl": "/uploads/model/xxx.glb", "format": "glb", "fileSize": 1024 }],
        "status": 1,
        "delFlag": 0
      }
    ],
    "total": 28,
    "page": 1,
    "pageSize": 10
  }
}
```

### 8.2 查询石棺详情

**接口信息**

- 接口路径：GET /coffins/:id
- 认证要求：是
- 接口描述：返回石棺全部业务字段及 `images`、`models`

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 石棺ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "1",
    "code": "CF-01",
    "name": "1号石棺",
    "cliffId": "1",
    "cliff": { "id": "1", "name": "洞溪崖墓群" },
    "viewCount": 3,
    "images": [],
    "models": [],
    "status": 1
  }
}
```

### 8.3 新增石棺

**接口信息**

- 接口路径：POST /coffins
- 认证要求：是
- 接口描述：新增石棺，`code` 必填且唯一

**请求参数**

```json
{
  "code": "CF-29",
  "name": "乐舞百戏石棺",
  "cliffId": 2,
  "dynasty": "东汉",
  "grade": "一级",
  "texture": "青石",
  "dimensions": "2.6×0.85×0.95m",
  "description": "该石棺侧面刻有乐舞百戏图案……",
  "mapLeft": 40.2,
  "mapTop": 55.1,
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 是 | 石棺编码（唯一） |
| name | string | 是 | 石棺名称 |
| cliffId | integer | 否 | 所属崖墓ID |
| dynasty / grade / source / completeness / dimensions / texture | string | 否 | 年代、级别、来源、完残、尺寸、质地 |
| description | string | 否 | 详细描述 |
| thumbnail | string | 否 | 缩略图地址 |
| mapLeft / mapTop | number | 否 | 导览地图百分比坐标（0-100） |
| status | integer | 否 | 状态，默认 1 |

> DTO 还支持 `originalName/registryType/tombGroup/eraCategory/eraSpecific/artifactCategory/materialCategory/materialSpecific/weightRange/weightValue/weightUnit/sourceDetail/completenessDetail/preservationStatus/accessionRange/accessionYear/quantity/dimText` 等馆藏字段。

**响应示例**：返回新建对象（`id`、`cliffId` 为字符串）。

### 8.4 修改石棺

**接口信息**

- 接口路径：PUT /coffins/:id
- 认证要求：是
- 接口描述：修改石棺信息；字段同 8.3

**响应示例**：返回修改后的对象。

### 8.5 删除石棺

**接口信息**

- 接口路径：DELETE /coffins/:id
- 认证要求：是
- 接口描述：逻辑删除（`delFlag=1`）

**响应示例**

```json
{ "code": 200, "message": "success", "data": null }
```

### 8.6 新增成果图

**接口信息**

- 接口路径：POST /coffins/:id/images
- 认证要求：是
- 接口描述：以 JSON 方式登记成果图地址（不是 multipart 上传）

**请求参数**

```json
{
  "imageUrl": "/uploads/coffin/xxx.png",
  "imageType": "ortho",
  "sort": 0
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| imageUrl | string | 是 | 图片地址（可先通过 `/resources/upload` 上传） |
| imageType | string | 是 | ortho 正射 / rubbing 拓片 / line 线划 / enhanced 增强 |
| sort | integer | 否 | 排序号 |

### 8.7 删除成果图

**接口信息**

- 接口路径：DELETE /coffins/:coffinId/images/:imageId
- 认证要求：是
- 接口描述：删除图片记录，不删除物理文件

**响应示例**

```json
{ "code": 200, "message": "success", "data": null }
```

### 8.8 新增 / 删除三维模型

**接口信息**

- 新增：POST /coffins/:id/models
- 删除：DELETE /coffins/:coffinId/models/:modelId
- 认证要求：是
- 接口描述：以 JSON 方式登记模型地址，不做文件上传

**请求参数**

```json
{ "modelUrl": "/uploads/model/xxx.glb", "format": "glb", "fileSize": 5242880 }
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| modelUrl | string | 是 | 模型地址 |
| format | string | 是 | glb / gltf |
| fileSize | number | 否 | 文件大小（字节） |

---

## 9. 全景管理模块

> 说明：`/panoramas` 为后台管理接口，需携带 JWT；游客端请使用 `/visitor/panoramas`。分类枚举为 `air/ground/inner/outdoor`，游客端把 `inner` 映射为“室内”。

### 9.1 查询全景列表

**接口信息**

- 接口路径：GET /panoramas
- 认证要求：是
- 接口描述：分页查询未删除全景场景

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 名称/位置/描述模糊匹配 |
| category | string | 否 | air / ground / inner / outdoor |
| status | integer | 否 | 0草稿 1在线 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "1",
        "name": "大耳朵崖墓空中全景",
        "category": "air",
        "location": "合江镇大耳朵村",
        "description": "……",
        "imageUrl": "/prototype/assets/pano-aerial.png",
        "fileSize": 2048,
        "viewCount": 5,
        "status": 1,
        "delFlag": 0,
        "viewpoints": [],
        "hotspots": []
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 10
  }
}
```

### 9.2 查询全景详情

**接口信息**

- 接口路径：GET /panoramas/:id
- 认证要求：是
- 接口描述：返回全景字段及 `viewpoints`、`hotspots`

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 全景ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "1",
    "name": "大耳朵崖墓空中全景",
    "category": "air",
    "imageUrl": "/prototype/assets/pano-aerial.png",
    "viewCount": 5,
    "viewpoints": [{ "id": "1", "name": "主视角", "lng": 105.8, "lat": 28.4, "height": 20 }],
    "hotspots": [{ "id": "1", "type": "scene", "config": "{\"target\":2}", "posX": 0.5, "posY": 0.1 }],
    "status": 1
  }
}
```

### 9.3 新增全景

**接口信息**

- 接口路径：POST /panoramas
- 认证要求：是
- 接口描述：新增全景场景

**请求参数**

```json
{
  "name": "博物馆室内全景",
  "category": "inner",
  "location": "合江县博物馆",
  "description": "博物馆展厅内部全景……",
  "imageUrl": "/prototype/assets/pano-museum-indoor-hall.png",
  "fileSize": 2048,
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 场景名称 |
| category | string | 否 | air / ground / inner / outdoor |
| location / description | string | 否 | 位置、描述 |
| imageUrl | string | 否 | 全景图地址 |
| fileSize | integer | 否 | 文件大小（KB） |
| status | integer | 否 | 0草稿 1在线，默认 1 |

### 9.4 修改 / 删除全景

| 方法 | 路径 | 说明 |
|---|---|---|
| PUT | /panoramas/:id | 修改全景，字段同 9.3 |
| DELETE | /panoramas/:id | 逻辑删除（`delFlag=1`） |

### 9.5 上传全景图片

**接口信息**

- 接口路径：POST /panoramas/:id/upload
- 认证要求：是
- 接口描述：multipart 上传全景图，保存到 `uploads/panorama/` 并回写 `imageUrl/fileSize`

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 全景图片，单文件上限 500MB |

**响应示例**

```json
{ "code": 200, "message": "success", "data": { "imageUrl": "/uploads/panorama/xxx.jpg", "fileSize": 1024 } }
```

### 9.6 视角点与热点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /panoramas/:id/viewpoints | 新增视角点（name/lng/lat/height） |
| DELETE | /panoramas/:panoramaId/viewpoints/:viewpointId | 删除视角点 |
| POST | /panoramas/:id/hotspots | 新增热点（type/config/posX/posY） |
| DELETE | /panoramas/:panoramaId/hotspots/:hotspotId | 删除热点 |

---

## 10. 资源管理模块

### 10.1 查询资源树

获取资源目录树。

**接口信息**

- 接口路径：GET /resources/tree
- 认证要求：是
- 接口描述：获取资源目录树

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "崖墓图片",
      "type": "directory",
      "parentId": 0,
      "children": [
        {
          "id": 2,
          "name": "大耳朵崖墓",
          "type": "directory",
          "parentId": 1
        }
      ]
    }
  ]
}
```

### 10.2 查询资源列表

查询指定目录下的资源列表。

**接口信息**

- 接口路径：GET /resources
- 认证要求：是
- 接口描述：查询资源列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| parentId | integer | 否 | 上级目录ID，根目录为0 |
| name | string | 否 | 资源名称（模糊匹配） |
| type | string | 否 | 类型：directory图片、model三维模型、panorama全景、document文档、video视频、audio音频、archive压缩包 |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 10,
        "name": "崖墓外景.jpg",
        "type": "image",
        "parentId": 2,
        "fileUrl": "https://xxx.com/cliff-1.jpg",
        "fileSize": 1024000,
        "mimeType": "image/jpeg",
        "createTime": "2026-01-01 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 10.3 新增资源

创建新的资源（目录或上传文件）。

**接口信息**

- 接口路径：POST /resources
- 认证要求：是
- 接口描述：新增资源

**请求参数（目录）**

```json
{
  "name": "新目录",
  "type": "directory",
  "parentId": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 资源名称 |
| type | string | 是 | 类型：directory表示目录 |
| parentId | integer | 是 | 上级目录ID |

**请求参数（文件）**

使用multipart/form-data格式上传

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 文件 |
| parentId | integer | 是 | 上级目录ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 20
  }
}
```

### 10.4 删除资源

删除资源（目录或文件）。

**接口信息**

- 接口路径：DELETE /resources/:id
- 认证要求：是
- 接口描述：删除资源

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 资源ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 10.5 移动资源

移动资源到其他目录。

**接口信息**

- 接口路径：PUT /resources/:id/move
- 认证要求：是
- 接口描述：移动资源

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 资源ID |

**请求参数**

```json
{
  "targetParentId": 5
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| targetParentId | integer | 是 | 目标上级目录ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 11. 系统配置模块

### 11.1 查询通知公告列表

分页查询通知公告列表。

**接口信息**

- 接口路径：GET /notices
- 认证要求：否（公开接口）
- 接口描述：查询通知公告列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 否 | 标题（模糊匹配） |
| type | integer | 否 | 类型：1通知 2公告 |
| status | integer | 否 | 状态：0草稿 1已发布 |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "系统维护通知",
        "type": 1,
        "content": "系统将于周末进行维护...",
        "status": 1,
        "publishTime": "2026-05-20 10:00:00",
        "createTime": "2026-05-19 10:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10
  }
}
```

### 11.2 查询公告详情

根据ID查询公告详情。

**接口信息**

- 接口路径：GET /notices/:id
- 认证要求：否（公开接口）
- 接口描述：查询公告详情

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 公告ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "系统维护通知",
    "type": 1,
    "content": "<p>系统将于周末进行维护...</p>",
    "targetType": "all",
    "status": 1,
    "publishTime": "2026-05-20 10:00:00",
    "createTime": "2026-05-19 10:00:00"
  }
}
```

### 11.3 新增通知公告

创建新的通知公告。

**接口信息**

- 接口路径：POST /notices
- 认证要求：是
- 接口描述：新增通知公告

**请求参数**

```json
{
  "title": "系统升级通知",
  "type": 1,
  "content": "<p>系统将于下周进行升级...</p>",
  "targetType": "all",
  "status": 0
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 标题 |
| type | integer | 是 | 类型：1通知 2公告 |
| content | string | 是 | 内容（富文本HTML） |
| targetType | string | 否 | 可见范围：all全部、dept指定部门、role指定角色 |
| targetIds | array | 否 | 目标ID列表（当targetType不为all时） |
| status | integer | 否 | 状态：0草稿 1已发布 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10
  }
}
```

### 11.4 发布通知公告

将草稿状态的公告发布上线。

**接口信息**

- 接口路径：PUT /notices/:id/publish
- 认证要求：是
- 接口描述：发布通知公告

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 公告ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 12. 日志管理模块

> **实现说明（2026-11-06）**：当前实际接口为：
>
> - `GET /logs/login?page&pageSize&keyword|username`
> - `GET /logs/login/export?keyword`
> - `GET /logs/operations?page&pageSize&keyword&startTime&endTime`（`GET /logs/operation` 为兼容旧路径）
> - `GET /logs/operations/export?keyword&startTime&endTime`
> - `DELETE /logs/operations/clear`、`DELETE /logs/operations/batch`、`DELETE /logs/operations/:id`
> - `DELETE /logs/login/clear`、`DELETE /logs/login/batch`、`DELETE /logs/login/:id`
>
> 以下示例字段为早期设计；实际返回为 `{ items, total, page, pageSize }`，登录日志字段包含 `username/ip/success/failReason/loginTime`。

### 12.1 查询登录日志

分页查询登录日志。

**接口信息**

- 接口路径：GET /logs/login
- 认证要求：是
- 接口描述：查询登录日志

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 否 | 用户名（模糊匹配） |
| status | integer | 否 | 登录状态：0失败 1成功 |
| ip | string | 否 | IP地址（模糊匹配） |
| startTime | string | 否 | 开始时间 |
| endTime | string | 否 | 结束时间 |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "ip": "192.168.1.100",
        "os": "Windows 10",
        "browser": "Chrome 120",
        "status": 1,
        "msg": "登录成功",
        "loginTime": "2026-05-21 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 12.2 查询操作日志

分页查询操作日志。

**接口信息**

- 接口路径：GET /logs/operation
- 认证要求：是
- 接口描述：查询操作日志

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| operName | string | 否 | 操作人（模糊匹配） |
| businessType | string | 否 | 业务类型 |
| status | integer | 否 | 操作状态：0失败 1成功 |
| startTime | string | 否 | 开始时间 |
| endTime | string | 否 | 结束时间 |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "operName": "admin",
        "businessType": "石棺管理",
        "method": "POST /api/v1/coffins",
        "requestMethod": "POST",
        "operUrl": "/api/v1/coffins",
        "operIp": "192.168.1.100",
        "operLocation": "四川省泸州市",
        "operParam": "{\"name\":\"新石棺\"}",
        "status": 1,
        "costTime": 150,
        "operTime": "2026-05-21 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 12.3 删除登录日志

删除登录日志。

**接口信息**

- 接口路径：DELETE /logs/login/:id
- 认证要求：是
- 接口描述：删除登录日志

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 日志ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 12.4 清空操作日志

清空所有操作日志。

**接口信息**

- 接口路径：DELETE /logs/operation/clean
- 认证要求：是
- 接口描述：清空操作日志

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 13. 运维监控模块

### 13.1 查询在线用户

查询当前在线用户列表。

**接口信息**

- 接口路径：GET /monitor/online
- 认证要求：是
- 接口描述：查询在线用户列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 否 | 用户名（模糊匹配） |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "tokenId": "xxx",
        "username": "admin",
        "ip": "192.168.1.100",
        "loginTime": "2026-05-21 10:00:00",
        "lastAccessTime": "2026-05-21 10:30:00",
        "os": "Windows 10",
        "browser": "Chrome 120"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

### 13.2 强制下线

强制指定用户下线。

**接口信息**

- 接口路径：DELETE /monitor/online/:tokenId
- 认证要求：是
- 接口描述：强制用户下线

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| tokenId | string | Token ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 13.3 查询服务监控

查询服务器运行状态。

**接口信息**

- 接口路径：GET /monitor/server
- 认证要求：是
- 接口描述：查询服务监控信息

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "cpu": {
      "coreCount": 8,
      "usedPercent": 45.5,
      "sysPercent": 10.2,
      "userPercent": 35.3
    },
    "memory": {
      "total": 16384,
      "used": 8192,
      "available": 8192,
      "usedPercent": 50
    },
    "jvm": {
      "total": 2048,
      "used": 1024,
      "available": 1024,
      "usedPercent": 50,
      "version": "17.0.1",
      "home": "/usr/local/jdk"
    },
    "disk": [
      {
        "mount": "/",
        "total": 500000,
        "used": 200000,
        "available": 300000,
        "usedPercent": 40
      }
    ],
    "os": {
      "name": "Linux",
      "version": "Ubuntu 22.04",
      "arch": "amd64"
    },
    "timestamp": "2026-05-21T10:30:00+08:00"
  }
}
```

### 13.4 查询缓存信息

查询Redis缓存状态。

**接口信息**

- 接口路径：GET /monitor/cache
- 认证要求：是
- 接口描述：查询缓存监控信息

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "info": {
      "version": "7.0.5",
      "uptime": 864000,
      "connectedClients": 10,
      "usedMemory": 1048576,
      "usedMemoryHuman": "1M"
    },
    "commandStats": [
      {
        "command": "GET",
        "calls": 10000,
        "usec": 50000
      }
    ],
    "dbSize": 100,
    "timestamp": "2026-05-21T10:30:00+08:00"
  }
}
```

---

## 14. AI模块

> **实现状态（2026-11-06）**：本章为规划稿，当前未接入 LLM、向量库、SSE 或图像识别服务。`AiService` 仅返回占位内容：
>
> - `POST /ai/chat`：请求字段为 `message`（可选 `history`），返回 `{ reply: "AI assistant placeholder response for: \"...\"", timestamp }`。
> - `POST /ai/recognize`：请求字段为 `imageUrl`，返回 `{ imageUrl, results: [], message: "AI recognition placeholder - not yet configured" }`。
> - `GET /ai/history`：需登录，返回 `{ items: [], total: 0, page, pageSize, userId }`。
>
> 游客端与管理后台均无 AI 入口。以下示例为设计目标，不是当前实际返回。

### 14.1 智能问答

规划中的基于 RAG 架构的智能问答接口（当前为占位实现，见本章开头说明）。

**接口信息**

- 接口路径：POST /ai/chat
- 认证要求：是（当前控制器未标注 `@Public()`，受全局 JWT 守卫保护）
- 接口描述：规划为流式问答；当前为一次性 JSON 占位响应

**请求参数**

```json
{
  "question": "这具石棺上的车马出行画像代表什么含义？",
  "history": [
    {
      "role": "user",
      "content": "这具石棺是哪个朝代的？"
    },
    {
      "role": "assistant",
      "content": "根据研究，这具石棺属于东汉时期..."
    }
  ]
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| message | string | 是 | 用户问题（当前实现使用 `message`；下文示例中的 `question` 为规划字段） |
| history | array | 否 | 对话历史，最多10轮 |
| history[].role | string | 是 | 角色：user用户、assistant助手 |
| history[].content | string | 是 | 对话内容 |

**响应（SSE流式）**

```
data: {"type": "chunk", "content": "这具"}
data: {"type": "chunk", "content": "石棺上"}
data: {"type": "chunk", "content": "的车马"}
...
data: {"type": "sources", "refs": [{"id": 1, "title": "合江汉代画像石棺研究"}, {"id": 2, "title": "东汉崖墓考古报告"}]}
data: {"type": "done"}
```

**响应（非流式）**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "answer": "这具石棺上的车马出行画像是汉代常见的丧葬艺术题材...",
    "sources": [
      {
        "id": 1,
        "title": "合江汉代画像石棺研究",
        "content": "车马出行图是汉代墓葬中常见的画像题材..."
      }
    ]
  }
}
```

### 14.2 图像识别

规划中对上传图像进行内容识别（当前为占位实现，返回空结果）。

**接口信息**

- 接口路径：POST /ai/recognize
- 认证要求：是（受全局 JWT 守卫保护）
- 接口描述：规划中的图像识别；当前为占位响应

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 图片文件，支持jpg、png |
| type | string | 否 | 识别类型：auto自动、coffin石棺识别、inscription铭文识别 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "recognized": true,
    "type": "coffin",
    "result": {
      "title": "车马出行画像",
      "description": "该画像描绘了一辆马车和骑士出行的场景...",
      "era": "东汉",
      "confidence": 0.92
    },
    "suggestions": [
      "建议查看相关石棺：CK-01",
      "相关研究文献：《合江汉代画像石棺研究》第三章"
    ]
  }
}
```

### 14.3 获取对话历史

规划中获取用户的历史对话记录（当前返回空列表）。

**接口信息**

- 接口路径：GET /ai/history
- 认证要求：是
- 接口描述：获取对话历史

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "question": "这具石棺上的车马出行画像代表什么含义？",
        "answer": "这具石棺上的车马出行画像是汉代常见的丧葬艺术题材...",
        "createTime": "2026-05-21 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 15. 游客端公开接口与埋点

> 本章接口全部标记 `@Public()`，无需 JWT。仅返回 `status=1 && delFlag=0` 的数据（公告为 `published`），下架/删除后游客端即时不可见。

### 15.1 崖墓列表

- 路径：GET /visitor/cliffs
- 认证：否
- 说明：返回全部在线崖墓，按 `orderNum` 排序；字段含 `mapLeft/mapTop/coverImage/modelUrl/viewCount/images/entrances/coffins`，ID 以字符串返回。

```json
{ "code": 200, "message": "success", "data": { "items": [], "total": 13 } }
```

### 15.2 崖墓详情

- 路径：GET /visitor/cliffs/:id
- 认证：否
- 说明：未找到、已下架或已删除时返回 HTTP 404（`{"code":404,"message":"崖墓不存在"}`）。
- 游客详情仅当 `modelUrl` 有值时才渲染 `model-viewer`，否则显示“该崖墓三维模型待补充”空态。

### 15.3 石棺列表 / 详情

- 路径：GET /visitor/coffins、GET /visitor/coffins/:id
- 认证：否
- 说明：列表返回 `items/total`；详情返回 `images`（四类成果图）与 `models`。

### 15.4 全景列表 / 详情

- 路径：GET /visitor/panoramas、GET /visitor/panoramas/:id
- 认证：否
- 说明：只返回在线场景；`category` 为 `air/ground/inner/outdoor`，前端把 `inner` 映射为“室内”。

### 15.5 已发布公告

- 路径：GET /visitor/notices?limit=5
- 认证：否
- 说明：只返回 `status=published` 的公告，`limit` 最大 20，默认 5。

### 15.6 游客行为埋点

- 路径：POST /visitor/events
- 认证：否
- 说明：写入操作日志；`cliff_view/coffin_view/panorama_view` 会累加对应浏览量；携带 `visitorId` 时更新在线访客（游客会话 30 分钟过期）。

**请求参数**

```json
{
  "visitorId": "浏览器生成的访客ID",
  "event": "cliff_view",
  "page": "cliff",
  "targetId": "1",
  "detail": "可选补充信息"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| event | string | 是 | 事件标识，如 `cliff_view`、`coffin_stage_switch`、`panorama_switch` |
| page | string | 否 | home / cliff / coffin / coffin-map / panorama |
| targetId | string | 否 | 目标业务 ID |
| detail | string | 否 | 交互明细，如视图名称 |
| visitorId | string | 否 | 在线访客标识 |

**响应示例**

```json
{ "code": 200, "message": "success", "data": { "recorded": true } }
```

---

## 16. 错误码参考

### 16.1 认证模块错误码

| 错误码 | 说明 |
|--------|------|
| 10001 | 账号不存在 |
| 10002 | 密码错误 |
| 10003 | 账号已锁定 |
| 10004 | Token已过期 |
| 10005 | Token无效 |
| 10006 | 登录失败次数过多 |
| 10007 | 验证码错误 |
| 10008 | 验证码已过期 |

### 16.2 系统模块错误码

| 错误码 | 说明 |
|--------|------|
| 20001 | 无权限访问 |
| 20002 | 参数错误 |
| 20003 | 数据不存在 |
| 20004 | 数据已存在 |
| 20005 | 操作失败 |
| 20006 | 请求方法不支持 |
| 20007 | 请求格式错误 |
| 20008 | 文件大小超出限制 |
| 20009 | 文件类型不支持 |

### 16.3 业务模块错误码

| 错误码 | 说明 |
|--------|------|
| 30001 | 崖墓不存在 |
| 30002 | 石棺不存在 |
| 30003 | 全景不存在 |
| 30004 | 资源不存在 |
| 30005 | 关联数据不存在 |
| 30006 | 目录不为空 |
| 30007 | 存在下级数据 |

### 16.4 AI模块错误码

| 错误码 | 说明 |
|--------|------|
| 40001 | AI服务不可用 |
| 40002 | 请求超时 |
| 40003 | 模型响应错误 |
| 40004 | 向量检索失败 |
| 40005 | 知识库为空 |

---

**文档结束**
