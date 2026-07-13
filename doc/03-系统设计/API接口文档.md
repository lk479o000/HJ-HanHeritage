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
15. [错误码参考](#15-错误码参考)

---

## 1. 概述

### 1.1 文档目的

本文档定义合江汉代画像石棺数字化保护与展示利用项目的所有API接口规范，包括接口路径、请求方式、请求参数、响应格式、错误处理等内容。本文档是前后端开发的契约依据，所有接口需严格遵循本文档定义的规范进行实现和调用。

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

### 7.1 查询崖墓列表

分页查询崖墓群列表。

**接口信息**

- 接口路径：GET /cliffs
- 认证要求：否（公开接口）
- 接口描述：分页查询崖墓群列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 否 | 编号（精确匹配） |
| name | string | 否 | 名称（模糊匹配） |
| district | string | 否 | 所属乡镇 |
| featured | integer | 否 | 是否重点：0否 1是 |
| status | integer | 否 | 状态：0下线 1上线 |
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
        "code": "CM-01",
        "name": "大耳朵崖墓群",
        "lng": 105.83123,
        "lat": 28.45234,
        "district": "合江镇",
        "featured": 1,
        "status": 1,
        "coffinCount": 5,
        "createTime": "2026-01-01 10:00:00"
      }
    ],
    "total": 13,
    "page": 1,
    "pageSize": 10
  }
}
```

### 7.2 查询崖墓详情

根据ID查询崖墓群详细信息。

**接口信息**

- 接口路径：GET /cliffs/:id
- 认证要求：否（公开接口）
- 接口描述：查询崖墓群详情

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
    "id": 1,
    "code": "CM-01",
    "name": "大耳朵崖墓群",
    "lng": 105.83123,
    "lat": 28.45234,
    "area": 1500,
    "level": "省级文物保护单位",
    "era": "东汉",
    "district": "合江镇",
    "description": "大耳朵崖墓群是合江汉代崖墓的代表性遗址...",
    "featured": 1,
    "status": 1,
    "imageUrl": "https://xxx.com/cliff-1.jpg",
    "modelUrl": "https://xxx.com/cline-1.glb",
    "coffins": [
      {
        "id": 1,
        "code": "CK-01",
        "name": "1号石棺"
      }
    ],
    "entranceCount": 3,
    "createTime": "2026-01-01 10:00:00"
  }
}
```

### 7.3 新增崖墓

创建新的崖墓群记录。

**接口信息**

- 接口路径：POST /cliffs
- 认证要求：是
- 接口描述：新增崖墓群

**请求参数**

```json
{
  "name": "福宝崖墓群",
  "lng": 105.84234,
  "lat": 28.48321,
  "area": 1200,
  "level": "县级文物保护单位",
  "era": "东汉",
  "district": "福宝镇",
  "description": "福宝崖墓群位于福宝镇...",
  "featured": 0,
  "status": 1,
  "imageUrl": "https://xxx.com/cliff-new.jpg"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 崖墓名称 |
| lng | number | 否 | 经度 |
| lat | number | 否 | 纬度 |
| area | number | 否 | 面积（平方米） |
| level | string | 否 | 保护级别 |
| era | string | 否 | 年代 |
| district | string | 否 | 所属乡镇 |
| description | string | 否 | 详细介绍 |
| featured | integer | 否 | 是否重点标注 |
| status | integer | 否 | 状态 |
| imageUrl | string | 否 | 图片URL |
| modelUrl | string | 否 | 三维模型URL |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 14,
    "code": "CM-14"
  }
}
```

### 7.4 修改崖墓

更新崖墓群信息。

**接口信息**

- 接口路径：PUT /cliffs/:id
- 认证要求：是
- 接口描述：修改崖墓群

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 崖墓ID |

**请求参数**

```json
{
  "name": "福宝崖墓群",
  "lng": 105.84234,
  "lat": 28.48321,
  "area": 1500,
  "level": "县级文物保护单位",
  "era": "东汉",
  "district": "福宝镇",
  "description": "福宝崖墓群位于福宝镇...",
  "featured": 1,
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

### 7.5 删除崖墓

删除崖墓群。

**接口信息**

- 接口路径：DELETE /cliffs/:id
- 认证要求：是
- 接口描述：删除崖墓群

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 崖墓ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 7.6 查询墓口列表

查询崖墓群下的墓口点位列表。

**接口信息**

- 接口路径：GET /cliffs/:id/entrances
- 认证要求：是
- 接口描述：查询墓口点位列表

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 崖墓ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "cliffId": 1,
      "name": "1号墓口",
      "x": 10.5,
      "y": 20.3,
      "z": 5.8,
      "heading": 180,
      "pitch": 0,
      "description": "主墓口，面向东方",
      "createTime": "2026-01-01 10:00:00"
    }
  ]
}
```

### 7.7 新增墓口

为崖墓群添加墓口点位。

**接口信息**

- 接口路径：POST /cliffs/:id/entrances
- 认证要求：是
- 接口描述：新增墓口点位

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 崖墓ID |

**请求参数**

```json
{
  "name": "2号墓口",
  "x": 15.2,
  "y": 22.1,
  "z": 6.5,
  "heading": 90,
  "pitch": 0,
  "description": "副墓口"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 墓口名称 |
| x | number | 是 | 三维坐标X |
| y | number | 是 | 三维坐标Y |
| z | number | 是 | 三维坐标Z |
| heading | number | 否 | 朝向角度 |
| pitch | number | 否 | 俯仰角度 |
| description | string | 否 | 描述 |

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

---

## 8. 石棺管理模块

### 8.1 查询石棺列表

分页查询石棺列表。

**接口信息**

- 接口路径：GET /coffins
- 认证要求：否（公开接口）
- 接口描述：分页查询石棺列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 否 | 编号（精确匹配） |
| name | string | 否 | 名称（模糊匹配） |
| cliffId | integer | 否 | 崖墓ID |
| era | string | 否 | 年代 |
| type | string | 否 | 类型 |
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
        "code": "CK-01",
        "name": "车马出行画像石棺",
        "cliffId": 1,
        "cliffName": "大耳朵崖墓群",
        "era": "东汉",
        "type": "完整",
        "thumbnailUrl": "https://xxx.com/coffin-1-thumb.jpg",
        "status": 1,
        "createTime": "2026-01-01 10:00:00"
      }
    ],
    "total": 28,
    "page": 1,
    "pageSize": 10
  }
}
```

### 8.2 查询石棺详情

根据ID查询石棺详细信息。

**接口信息**

- 接口路径：GET /coffins/:id
- 认证要求：否（公开接口）
- 接口描述：查询石棺详情

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
    "id": 1,
    "code": "CK-01",
    "name": "车马出行画像石棺",
    "cliffId": 1,
    "cliffName": "大耳朵崖墓群",
    "era": "东汉",
    "type": "完整",
    "length": 2.5,
    "width": 0.8,
    "height": 0.9,
    "texture": "红砂石",
    "preservation": "良好",
    "description": "该石棺侧壁刻有车马出行图...",
    "thumbnailUrl": "https://xxx.com/coffin-1-thumb.jpg",
    "models": [
      {
        "id": 1,
        "url": "https://xxx.com/coffin-1.glb",
        "format": "glb",
        "fileSize": 5242880
      }
    ],
    "images": {
      "ortho": [
        {
          "id": 1,
          "url": "https://xxx.com/coffin-1-ortho-1.jpg"
        }
      ],
      "rubbing": [],
      "line": [],
      "enhanced": []
    },
    "status": 1,
    "createTime": "2026-01-01 10:00:00"
  }
}
```

### 8.3 新增石棺

创建新的石棺记录。

**接口信息**

- 接口路径：POST /coffins
- 认证要求：是
- 接口描述：新增石棺

**请求参数**

```json
{
  "name": "乐舞百戏石棺",
  "cliffId": 2,
  "era": "东汉",
  "type": "完整",
  "length": 2.6,
  "width": 0.85,
  "height": 0.95,
  "texture": "青石",
  "preservation": "较好",
  "description": "该石棺侧面刻有乐舞百戏图案...",
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 石棺名称 |
| cliffId | integer | 是 | 所属崖墓ID |
| era | string | 否 | 年代 |
| type | string | 否 | 类型 |
| length | number | 否 | 长度（米） |
| width | number | 否 | 宽度（米） |
| height | number | 否 | 高度（米） |
| texture | string | 否 | 质地 |
| preservation | string | 否 | 保存状况 |
| description | string | 否 | 详细描述 |
| status | integer | 否 | 状态 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 29,
    "code": "CK-29"
  }
}
```

### 8.4 修改石棺

更新石棺信息。

**接口信息**

- 接口路径：PUT /coffins/:id
- 认证要求：是
- 接口描述：修改石棺

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 石棺ID |

**请求参数**

```json
{
  "name": "车马出行画像石棺（修复版）",
  "era": "东汉",
  "type": "完整",
  "preservation": "修复后良好",
  "description": "该石棺侧壁刻有车马出行图，经过专业修复..."
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

### 8.5 删除石棺

删除石棺记录。

**接口信息**

- 接口路径：DELETE /coffins/:id
- 认证要求：是
- 接口描述：删除石棺

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 石棺ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 8.6 上传成果图

上传石棺成果图。

**接口信息**

- 接口路径：POST /coffins/:id/images
- 认证要求：是
- 接口描述：上传石棺成果图

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 石棺ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 图片文件，支持jpg、png |
| imageType | string | 是 | 图片类型：ortho正射、rubbing拓片、line线划图、enhanced增强图 |
| sort | integer | 否 | 排序号 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 100,
    "url": "https://xxx.com/coffin-1-ortho-2.jpg"
  }
}
```

### 8.7 删除成果图

删除石棺成果图。

**接口信息**

- 接口路径：DELETE /coffins/:id/images/:imageId
- 认证要求：是
- 接口描述：删除成果图

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 石棺ID |
| imageId | integer | 图片ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 8.8 上传三维模型

上传石棺三维模型文件。

**接口信息**

- 接口路径：POST /coffins/:id/models
- 认证要求：是
- 接口描述：上传三维模型

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 石棺ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 模型文件，支持glb、gltf格式，大小不超过50MB |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 50,
    "url": "https://xxx.com/coffin-1.glb",
    "format": "glb",
    "fileSize": 5242880
  }
}
```

---

## 9. 全景管理模块

### 9.1 查询全景列表

分页查询全景场景列表。

**接口信息**

- 接口路径：GET /panoramas
- 认证要求：否（公开接口）
- 接口描述：分页查询全景列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 场景名称（模糊匹配） |
| type | string | 否 | 类型：aerial空中、ground地面、indoor室内、other其他 |
| status | integer | 否 | 状态：0下线 1上线 |
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
        "name": "大耳朵崖墓空中全景",
        "type": "aerial",
        "location": "合江镇大耳朵村",
        "thumbnailUrl": "https://xxx.com/panorama-1-thumb.jpg",
        "status": 1,
        "createTime": "2026-01-01 10:00:00"
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 10
  }
}
```

### 9.2 查询全景详情

根据ID查询全景详细信息。

**接口信息**

- 接口路径：GET /panoramas/:id
- 认证要求：是
- 接口描述：查询全景详情

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
    "id": 1,
    "name": "大耳朵崖墓空中全景",
    "type": "aerial",
    "location": "合江镇大耳朵村",
    "description": "从空中俯瞰大耳朵崖墓群全貌...",
    "imageUrl": "https://xxx.com/panorama-1.jpg",
    "status": 1,
    "viewpoints": [
      {
        "id": 1,
        "name": "主视角",
        "pitch": 0,
        "yaw": 0
      }
    ],
    "hotspots": [
      {
        "id": 1,
        "type": "scene",
        "pitch": -5,
        "yaw": 120,
        "targetSceneId": 2,
        "targetSceneName": "崖墓近景"
      }
    ],
    "createTime": "2026-01-01 10:00:00"
  }
}
```

### 9.3 新增全景

创建新的全景场景。

**接口信息**

- 接口路径：POST /panoramas
- 认证要求：是
- 接口描述：新增全景

**请求参数**

```json
{
  "name": "博物馆室内全景",
  "type": "indoor",
  "location": "合江县博物馆",
  "description": "博物馆展厅内部全景...",
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 场景名称 |
| type | string | 是 | 类型 |
| location | string | 否 | 位置 |
| description | string | 否 | 描述 |
| status | integer | 否 | 状态 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 9
  }
}
```

### 9.4 上传全景图片

上传全景场景图片。

**接口信息**

- 接口路径：POST /panoramas/:id/image
- 认证要求：是
- 接口描述：上传全景图片

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 全景ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 全景图片文件，支持jpg格式，建议尺寸8192×4096，大小不超过30MB |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "url": "https://xxx.com/panorama-9.jpg"
  }
}
```

### 9.5 修改全景状态

修改全景上线或下线状态。

**接口信息**

- 接口路径：PUT /panoramas/:id/status
- 认证要求：是
- 接口描述：修改全景状态

**路径参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 全景ID |

**请求参数**

```json
{
  "status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | integer | 是 | 状态：0下线 1上线 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

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

### 14.1 智能问答

基于RAG架构的智能问答接口。

**接口信息**

- 接口路径：POST /ai/chat
- 认证要求：否（公开接口）
- 接口描述：智能问答接口，支持流式响应

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
| question | string | 是 | 用户问题 |
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

对上传的图像进行内容识别。

**接口信息**

- 接口路径：POST /ai/recognize
- 认证要求：否（公开接口）
- 接口描述：图像识别接口

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

获取用户的历史对话记录。

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

## 15. 错误码参考

### 15.1 认证模块错误码

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

### 15.2 系统模块错误码

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

### 15.3 业务模块错误码

| 错误码 | 说明 |
|--------|------|
| 30001 | 崖墓不存在 |
| 30002 | 石棺不存在 |
| 30003 | 全景不存在 |
| 30004 | 资源不存在 |
| 30005 | 关联数据不存在 |
| 30006 | 目录不为空 |
| 30007 | 存在下级数据 |

### 15.4 AI模块错误码

| 错误码 | 说明 |
|--------|------|
| 40001 | AI服务不可用 |
| 40002 | 请求超时 |
| 40003 | 模型响应错误 |
| 40004 | 向量检索失败 |
| 40005 | 知识库为空 |

---

**文档结束**
