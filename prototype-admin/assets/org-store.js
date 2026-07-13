/**
 * 组织与权限模块：原型用内存数据（多页共享，便于用户-部门-角色联动）
 */
(function () {
  "use strict";
  if (window.OrgAdminStore) return;

  window.OrgAdminStore = {
    depts: [
      { id: "d1", name: "合江崖墓数字化项目组", parentId: null, sort: 1 },
      { id: "d2", name: "博物馆", parentId: "d1", sort: 1 },
      { id: "d3", name: "信息中心", parentId: "d2", sort: 1 },
      { id: "d4", name: "展教部", parentId: "d2", sort: 2 },
    ],
    roles: [
      { id: "r1", name: "系统管理员", parentId: null, sort: 1, code: "SYS_ADMIN", remark: "全部功能", dataScope: "all", permissionIds: ["m1", "m2", "m3", "m4", "m5"] },
      { id: "r2", name: "业务管理员", parentId: "r1", sort: 1, code: "SYS_ADMIN", remark: "业务与资源", dataScope: "dept", permissionIds: ["m2", "m3", "m4"] },
      { id: "r3", name: "内容编辑", parentId: "r2", sort: 1, code: "EDITOR", remark: "内容维护", dataScope: "dept", permissionIds: ["m3", "m4"] },
      { id: "r4", name: "访客角色", parentId: null, sort: 2, code: "GUEST", remark: "只读浏览", dataScope: "all", permissionIds: ["m5"] },
    ],
    posts: [
      { id: "p1", name: "馆长", parentId: null, sort: 1, remark: "全面负责", permissionIds: ["m1", "m2", "m3", "m4", "m5"] },
      { id: "p2", name: "副馆长", parentId: "p1", sort: 1, remark: "协管业务", permissionIds: ["m2", "m3", "m4"] },
      { id: "p3", name: "展教专员", parentId: "p2", sort: 2, remark: "展陈与讲解", permissionIds: ["m3", "m5"] },
    ],
    users: [
      {
        id: "u1",
        realName: "系统管理员",
        phone: "13800000001",
        deptId: "d3",
        roleIds: ["r1"],
        postIds: ["p1"],
        status: "enabled",
      },
      {
        id: "u2",
        realName: "张三",
        phone: "13800000002",
        deptId: "d4",
        roleIds: ["r3"],
        postIds: ["p3"],
        status: "enabled",
      },
      {
        id: "u3",
        realName: "李四",
        phone: "13800000003",
        deptId: "d2",
        roleIds: ["r2", "r4"],
        postIds: ["p2"],
        status: "disabled",
      },
    ],
    counters: { dept: 10, role: 10, post: 10, user: 10 },
  };
})();
