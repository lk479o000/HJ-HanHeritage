/**
 * 系统配置与通知：菜单树、公告、当前账户资料（localStorage，原型）
 */
(function () {
  "use strict";

  var KEY = "prototypeAdminSysConfigV1";

  /** 旧版扁平菜单，仅用于迁移 */
  var DEFAULT_MENU_LEGACY = [
    { id: "dashboard", group: "工作台", route: "dashboard.html", label: "首页概览", sort: 10 },
    { id: "cliff", group: "业务数据", route: "cliff.html", label: "崖墓管理", sort: 20 },
    { id: "coffin", group: "业务数据", route: "coffin.html", label: "石棺管理", sort: 30 },
    { id: "museum-pano", group: "业务数据", route: "museum-panorama.html", label: "博物馆全景管理", sort: 40 },
    { id: "resource", group: "业务数据", route: "resource.html", label: "资源管理", sort: 50 },
    { id: "user", group: "组织与权限", route: "user.html", label: "用户管理", sort: 60 },
    { id: "role", group: "组织与权限", route: "role.html", label: "角色管理", sort: 70 },
    { id: "dept", group: "组织与权限", route: "dept.html", label: "部门管理", sort: 80 },
    { id: "post", group: "组织与权限", route: "post.html", label: "岗位管理", sort: 90 },
    { id: "log-op", group: "日志与在线", route: "log-operation.html", label: "操作日志", sort: 100 },
    { id: "log-in", group: "日志与在线", route: "log-login.html", label: "登录日志", sort: 110 },
    { id: "online", group: "日志与在线", route: "online-users.html", label: "在线用户", sort: 120 },
    { id: "mon-jvm", group: "运维监控", route: "monitor-jvm.html", label: "服务监控", sort: 130 },
    { id: "mon-redis", group: "运维监控", route: "monitor-redis.html", label: "缓存监控", sort: 140 },
    { id: "menu", group: "系统配置", route: "menu.html", label: "菜单管理", sort: 170 },
    { id: "notice", group: "系统配置", route: "notice.html", label: "通知公告", sort: 180 },
    { id: "profile", group: "账户", route: "profile.html", label: "个人信息", sort: 190 },
  ];

  function deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  var DEFAULT_MENU_TREE = [
    {
      id: "mg-workbench",
      name: "工作台",
      icon: "guide",
      sort: 0,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 08:30:15",
      linkId: null,
      children: [
        {
          id: "mn-dashboard",
          name: "首页概览",
          icon: "dashboard",
          sort: 0,
          perms: "dashboard:list",
          component: "dashboard/index",
          status: "normal",
          createTime: "2026-01-08 08:31:02",
          linkId: "dashboard",
          children: [],
        },
      ],
    },
    {
      id: "mg-biz",
      name: "业务数据",
      icon: "cascader",
      sort: 1,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 09:00:00",
      linkId: null,
      children: [
        {
          id: "mn-cliff",
          name: "崖墓管理",
          icon: "tree",
          sort: 0,
          perms: "cliff:list",
          component: "cliff/index",
          status: "normal",
          createTime: "2026-01-08 09:05:11",
          linkId: "cliff",
          children: [],
        },
        {
          id: "mn-coffin",
          name: "石棺管理",
          icon: "component",
          sort: 1,
          perms: "coffin:list",
          component: "coffin/index",
          status: "normal",
          createTime: "2026-01-08 09:05:22",
          linkId: "coffin",
          children: [],
        },
        {
          id: "mn-museum",
          name: "博物馆全景管理",
          icon: "camera",
          sort: 2,
          perms: "panorama:list",
          component: "museum/index",
          status: "normal",
          createTime: "2026-01-08 09:06:00",
          linkId: "museum-pano",
          children: [],
        },
        {
          id: "mn-resource",
          name: "资源管理",
          icon: "documentation",
          sort: 3,
          perms: "resource:list",
          component: "resource/index",
          status: "normal",
          createTime: "2026-01-08 09:06:18",
          linkId: "resource",
          children: [],
        },
      ],
    },
    {
      id: "mg-org",
      name: "组织与权限",
      icon: "peoples",
      sort: 2,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 10:00:00",
      linkId: null,
      children: [
        { id: "mn-user", name: "用户管理", icon: "user", sort: 0, perms: "system:user:list", component: "system/user/index", status: "normal", createTime: "2026-01-08 10:01:00", linkId: "user", children: [] },
        { id: "mn-role", name: "角色管理", icon: "lock", sort: 1, perms: "system:role:list", component: "system/role/index", status: "normal", createTime: "2026-01-08 10:01:10", linkId: "role", children: [] },
        { id: "mn-dept", name: "部门管理", icon: "tree-table", sort: 2, perms: "system:dept:list", component: "system/dept/index", status: "normal", createTime: "2026-01-08 10:01:20", linkId: "dept", children: [] },
        { id: "mn-post", name: "岗位管理", icon: "postcard", sort: 3, perms: "system:post:list", component: "system/post/index", status: "normal", createTime: "2026-01-08 10:01:30", linkId: "post", children: [] },
      ],
    },
    {
      id: "mg-log",
      name: "日志与在线",
      icon: "log",
      sort: 3,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 11:00:00",
      linkId: null,
      children: [
        { id: "mn-logop", name: "操作日志", icon: "form", sort: 0, perms: "monitor:operlog:list", component: "monitor/operlog/index", status: "normal", createTime: "2026-01-08 11:01:00", linkId: "log-op", children: [] },
        { id: "mn-login", name: "登录日志", icon: "logininfor", sort: 1, perms: "monitor:logininfor:list", component: "monitor/logininfor/index", status: "normal", createTime: "2026-01-08 11:01:10", linkId: "log-in", children: [] },
        { id: "mn-online", name: "在线用户", icon: "online", sort: 2, perms: "monitor:online:list", component: "monitor/online/index", status: "normal", createTime: "2026-01-08 11:01:20", linkId: "online", children: [] },
      ],
    },
    {
      id: "mg-ops",
      name: "运维监控",
      icon: "server",
      sort: 4,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 12:00:00",
      linkId: null,
      children: [
        { id: "mn-monjvm", name: "服务监控", icon: "monitor", sort: 0, perms: "monitor:server:list", component: "monitor/server/index", status: "normal", createTime: "2026-01-08 12:01:00", linkId: "mon-jvm", children: [] },
        { id: "mn-monredis", name: "缓存监控", icon: "redis", sort: 1, perms: "monitor:cache:list", component: "monitor/cache/index", status: "normal", createTime: "2026-01-08 12:01:10", linkId: "mon-redis", children: [] },
      ],
    },
    {
      id: "mg-sys",
      name: "系统配置",
      icon: "system",
      sort: 5,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 13:00:00",
      linkId: null,
      children: [
        { id: "mn-menu", name: "菜单管理", icon: "tree-table", sort: 0, perms: "system:menu:list", component: "system/menu/index", status: "normal", createTime: "2026-01-08 13:01:10", linkId: "menu", children: [] },
        { id: "mn-notice", name: "通知公告", icon: "message", sort: 1, perms: "system:notice:list", component: "system/notice/index", status: "normal", createTime: "2026-01-08 13:01:20", linkId: "notice", children: [] },
      ],
    },
    {
      id: "mg-account",
      name: "账户",
      icon: "user",
      sort: 6,
      perms: "",
      component: "",
      status: "normal",
      createTime: "2026-01-08 14:00:00",
      linkId: null,
      children: [
        { id: "mn-profile", name: "个人信息", icon: "people", sort: 0, perms: "system:profile:view", component: "system/profile/index", status: "normal", createTime: "2026-01-08 14:01:00", linkId: "profile", children: [] },
      ],
    },
  ];

  var DEFAULT_NOTICES = [
    {
      id: "n1",
      title: "系统维护通知",
      content: "计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。",
      contentHtml: "<p>计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。</p>",
      status: "published",
      scope: { type: "all", ids: [] },
      publishedAt: new Date(2026, 5, 22, 0, 0).getTime(),
      updatedAt: new Date(2026, 5, 20, 10, 0).getTime(),
    },
    {
      id: "n2",
      title: "内部培训（草稿）",
      content: "新员工平台使用培训，时间待定。",
      contentHtml: "<p>新员工平台使用培训，时间待定。</p>",
      status: "draft",
      scope: { type: "all", ids: [] },
      publishedAt: null,
      updatedAt: new Date(2026, 3, 1, 10, 0).getTime(),
    },
  ];

  var DEFAULT_PROFILE = {
    account: "admin",
    displayName: "管理员",
    phone: "13800000000",
    email: "",
    dept: "信息中心",
    roles: "系统管理员",
    createdAt: "2026-01-15 10:00",
  };

  function migrateMenuItemsToTree(items) {
    var order = [];
    var seen = {};
    items.forEach(function (m) {
      if (!seen[m.group]) {
        seen[m.group] = true;
        order.push(m.group);
      }
    });
    return order.map(function (gName, gi) {
      var subs = items.filter(function (m) {
        return m.group === gName;
      });
      subs.sort(function (a, b) {
        return (a.sort || 0) - (b.sort || 0);
      });
      return {
        id: "mg-mig-" + gi,
        name: gName,
        icon: "folder",
        sort: gi,
        perms: "",
        component: "",
        status: "normal",
        createTime: "2026-01-10 09:00:00",
        linkId: null,
        children: subs.map(function (m, si) {
          return {
            id: "mn-mig-" + m.id,
            name: m.label,
            icon: "doc",
            sort: si,
            perms: m.id + ":list",
            component: m.route.replace(".html", "/index"),
            status: "normal",
            createTime: "2026-01-10 10:00:00",
            linkId: m.id,
            children: [],
          };
        }),
      };
    });
  }

  function flattenLinkMap(nodes, map) {
    map = map || {};
    (nodes || []).forEach(function (n) {
      if (n.linkId) {
        if (n.status === "disabled") {
          map[n.linkId] = { label: n.name, sort: n.sort, hidden: true };
        } else {
          map[n.linkId] = { label: n.name, sort: n.sort };
        }
      }
      flattenLinkMap(n.children, map);
    });
    return map;
  }

  function findInTree(nodes, id) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return { node: nodes[i], list: nodes, index: i };
      var ch = nodes[i].children;
      if (ch && ch.length) {
        var f = findInTree(ch, id);
        if (f) return f;
      }
    }
    return null;
  }

  function loadRaw() {
    try {
      var j = localStorage.getItem(KEY);
      if (j) return JSON.parse(j);
    } catch (e) {}
    return null;
  }

  function saveRaw(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  var REMOVED_MENU_LINK_IDS = { "mon-sys": true, "sys-integration": true };

  function pruneRemovedMenuNodes(nodes) {
    var out = [];
    (nodes || []).forEach(function (n) {
      if (n.linkId && REMOVED_MENU_LINK_IDS[n.linkId]) return;
      var nn = Object.assign({}, n);
      nn.children = pruneRemovedMenuNodes(n.children || []);
      out.push(nn);
    });
    return out;
  }

  function ensureShape(data) {
    if (!data.menuTree || !Array.isArray(data.menuTree) || data.menuTree.length === 0) {
      if (data.menuItems && data.menuItems.length) {
        data.menuTree = migrateMenuItemsToTree(data.menuItems);
        delete data.menuItems;
      } else {
        data.menuTree = deepClone(DEFAULT_MENU_TREE);
      }
    } else if (data.menuItems) {
      delete data.menuItems;
    }
    data.menuTree = pruneRemovedMenuNodes(data.menuTree);
    if (!data.notices || !Array.isArray(data.notices)) data.notices = DEFAULT_NOTICES.slice();
    else {
      data.notices.forEach(function (n) {
        if (n && typeof n === "object") {
          if (n.contentHtml == null) n.contentHtml = "<p>" + String(n.content || "") + "</p>";
          if (!n.scope || typeof n.scope !== "object") n.scope = { type: "all", ids: [] };
          if (!n.scope.type) n.scope.type = "all";
          if (!Array.isArray(n.scope.ids)) n.scope.ids = [];
        }
      });
    }
    if (!data.profile || typeof data.profile !== "object") data.profile = Object.assign({}, DEFAULT_PROFILE);
    else {
      Object.keys(DEFAULT_PROFILE).forEach(function (k) {
        if (data.profile[k] == null) data.profile[k] = DEFAULT_PROFILE[k];
      });
    }
    return data;
  }

  function getState() {
    var data = loadRaw();
    if (!data) {
      data = {
        menuTree: deepClone(DEFAULT_MENU_TREE),
        notices: DEFAULT_NOTICES.map(function (n) {
          return Object.assign({}, n);
        }),
        profile: Object.assign({}, DEFAULT_PROFILE),
      };
      saveRaw(data);
      return data;
    }
    ensureShape(data);
    saveRaw(data);
    return data;
  }

  function fmtNow() {
    var d = new Date();
    function p(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      " " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes()) +
      ":" +
      p(d.getSeconds())
    );
  }

  window.SysConfigStore = {
    KEY: KEY,

    getState: getState,

    persist: function () {
      saveRaw(getState());
    },

    getMenuTree: function () {
      return getState().menuTree;
    },

    getMenuNode: function (id) {
      var f = findInTree(getState().menuTree, id);
      return f ? f.node : null;
    },

    updateMenuNode: function (id, patch) {
      var st = getState();
      var f = findInTree(st.menuTree, id);
      if (!f) return null;
      var n = f.node;
      if (patch.name != null) n.name = String(patch.name).trim() || n.name;
      if (patch.sort != null && !isNaN(+patch.sort)) n.sort = +patch.sort;
      if (patch.icon != null) n.icon = String(patch.icon);
      if (patch.perms != null) n.perms = String(patch.perms);
      if (patch.component != null) n.component = String(patch.component);
      if (patch.status === "normal" || patch.status === "disabled") n.status = patch.status;
      saveRaw(st);
      return n;
    },

    addMenuNode: function (parentId, partial) {
      var st = getState();
      var id = "mn-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      var node = {
        id: id,
        name: String((partial && partial.name) || "新菜单").trim() || "新菜单",
        icon: String((partial && partial.icon) || "menu"),
        sort: partial && partial.sort != null && !isNaN(+partial.sort) ? +partial.sort : 0,
        perms: String((partial && partial.perms) || ""),
        component: String((partial && partial.component) || ""),
        status: partial && partial.status === "disabled" ? "disabled" : "normal",
        createTime: fmtNow(),
        linkId: partial && partial.linkId ? String(partial.linkId) : null,
        children: [],
      };
      if (!parentId) {
        st.menuTree.push(node);
      } else {
        var f = findInTree(st.menuTree, parentId);
        if (!f) return null;
        f.node.children = f.node.children || [];
        f.node.children.push(node);
      }
      saveRaw(st);
      return node;
    },

    deleteMenuNode: function (id) {
      var st = getState();
      var f = findInTree(st.menuTree, id);
      if (!f) return false;
      f.list.splice(f.index, 1);
      saveRaw(st);
      return true;
    },

    getPublishedNotices: function () {
      return getState()
        .notices.filter(function (n) {
          return n.status === "published";
        })
        .sort(function (a, b) {
          return (b.publishedAt || 0) - (a.publishedAt || 0);
        });
    },

    getNoticesSorted: function () {
      var list = getState().notices.slice();
      list.sort(function (a, b) {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      return list;
    },

    addNotice: function (row) {
      var st = getState();
      var id = "n" + Date.now().toString(36);
      var now = Date.now();
      var n = {
        id: id,
        title: String(row.title || "").trim() || "未命名公告",
        content: String(row.content || ""),
        contentHtml: String(row.contentHtml || ""),
        status: row.status === "draft" ? "draft" : "published",
        scope: row.scope && typeof row.scope === "object" ? row.scope : { type: "all", ids: [] },
        publishedAt: row.status === "draft" ? null : now,
        updatedAt: now,
      };
      st.notices.unshift(n);
      saveRaw(st);
      return n;
    },

    updateNotice: function (id, patch) {
      var st = getState();
      var n = st.notices.find(function (x) {
        return x.id === id;
      });
      if (!n) return null;
      if (patch.title != null) n.title = String(patch.title).trim() || n.title;
      if (patch.content != null) n.content = String(patch.content);
      if (patch.contentHtml != null) n.contentHtml = String(patch.contentHtml);
      if (patch.scope && typeof patch.scope === "object") n.scope = patch.scope;
      if (patch.status === "published" || patch.status === "draft") {
        n.status = patch.status;
        if (patch.status === "published" && !n.publishedAt) n.publishedAt = Date.now();
        if (patch.status === "draft") n.publishedAt = null;
      }
      n.updatedAt = Date.now();
      saveRaw(st);
      return n;
    },

    deleteNotice: function (id) {
      var st = getState();
      var i = st.notices.findIndex(function (x) {
        return x.id === id;
      });
      if (i < 0) return false;
      st.notices.splice(i, 1);
      saveRaw(st);
      return true;
    },

    getProfile: function () {
      return Object.assign({}, getState().profile);
    },

    updateProfile: function (patch) {
      var st = getState();
      var p = st.profile;
      if (patch.displayName != null) p.displayName = String(patch.displayName).trim() || p.displayName;
      if (patch.phone != null) p.phone = String(patch.phone).trim();
      if (patch.email != null) p.email = String(patch.email).trim();
      saveRaw(st);
      return Object.assign({}, p);
    },
  };

  window.SysConfigStore.readMenuOverrideMap = function () {
    try {
      return flattenLinkMap(getState().menuTree, {});
    } catch (e) {
      return {};
    }
  };

  window.SysConfigStore.readProfileDisplayName = function () {
    try {
      var p = getState().profile;
      return (p && p.displayName) || "管理员";
    } catch (e) {
      return "管理员";
    }
  };
})();
