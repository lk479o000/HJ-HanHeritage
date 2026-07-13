/**
 * 后台侧栏：左侧多级菜单 + 顶栏；壳 initShell + iframe
 */
(function (global) {
  "use strict";

  /**
   * 菜单树：一级为分组（可折叠），children 可为叶子 { id, label, href } 或子分组 { title, children }
   */
  var MENU_TREE = [
    {
      title: "业务数据",
      children: [
        { id: "cliff", label: "崖墓管理", href: "cliff.html" },
        { id: "coffin", label: "石棺管理", href: "coffin.html" },
        { id: "museum-pano", label: "博物馆全景管理", href: "museum-panorama.html" },
        { id: "resource", label: "资源管理", href: "resource.html" },
      ],
    },
    {
      title: "组织与权限",
      children: [
        { id: "user", label: "用户管理", href: "user.html" },
        { id: "role", label: "角色管理", href: "role.html" },
        { id: "dept", label: "部门管理", href: "dept.html" },
        { id: "post", label: "岗位管理", href: "post.html" },
      ],
    },
    {
      title: "日志与在线",
      children: [
        { id: "log-op", label: "操作日志", href: "log-operation.html" },
        { id: "log-in", label: "登录日志", href: "log-login.html" },
        { id: "online", label: "在线用户", href: "online-users.html" },
      ],
    },
    {
      title: "运维监控",
      children: [
        { id: "mon-jvm", label: "服务监控", href: "monitor-jvm.html" },
        { id: "mon-redis", label: "缓存监控", href: "monitor-redis.html" },
      ],
    },
    {
      title: "系统配置",
      children: [
        { id: "menu", label: "菜单管理", href: "menu.html" },
        { id: "notice", label: "通知公告", href: "notice.html" },
      ],
    },
    {
      title: "账户",
      children: [{ id: "profile", label: "个人信息", href: "profile.html" }],
    },
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  var SYS_KEY = "prototypeAdminSysConfigV1";

  function flattenStoredMenuToMap(o) {
    var map = {};
    function walk(nodes) {
      (nodes || []).forEach(function (n) {
        if (n.linkId) {
          if (n.status === "disabled") map[n.linkId] = { label: n.name, sort: n.sort, hidden: true };
          else map[n.linkId] = { label: n.name, sort: n.sort };
        }
        walk(n.children || []);
      });
    }
    if (o.menuTree) walk(o.menuTree);
    else if (o.menuItems) {
      (o.menuItems || []).forEach(function (m) {
        map[m.id] = { label: m.label, sort: m.sort };
      });
    }
    return map;
  }

  function readMenuOverrideMap() {
    if (global.SysConfigStore && typeof global.SysConfigStore.readMenuOverrideMap === "function") {
      return global.SysConfigStore.readMenuOverrideMap();
    }
    try {
      var raw = localStorage.getItem(SYS_KEY);
      if (!raw) return {};
      return flattenStoredMenuToMap(JSON.parse(raw));
    } catch (e) {
      return {};
    }
  }

  function readProfileDisplayName() {
    if (global.SysConfigStore && typeof global.SysConfigStore.readProfileDisplayName === "function") {
      return global.SysConfigStore.readProfileDisplayName();
    }
    try {
      var raw = localStorage.getItem(SYS_KEY);
      if (!raw) return "管理员";
      var o = JSON.parse(raw);
      if (o && o.profile && o.profile.displayName) return String(o.profile.displayName);
    } catch (e) {}
    return "管理员";
  }

  /** 同级节点：叶子菜单按 SysConfigStore.sort 排序，子分组保持相对稳定 */
  function sortedMenuNodes(nodes) {
    var ov = readMenuOverrideMap();
    var decorated = nodes.map(function (n, i) {
      return { n: n, i: i };
    });
    decorated.sort(function (a, b) {
      var na = a.n;
      var nb = b.n;
      function sortKey(node, idx) {
        if (node.href) {
          var o = ov[node.id];
          return o && o.sort != null ? +o.sort : 50000 + idx;
        }
        return 200000 + idx;
      }
      var ka = sortKey(na, a.i);
      var kb = sortKey(nb, b.i);
      if (ka !== kb) return ka - kb;
      return a.i - b.i;
    });
    return decorated.map(function (x) {
      return x.n;
    });
  }

  function withEmbed(href) {
    return href.indexOf("?") >= 0 ? href + "&embed=1" : href + "?embed=1";
  }

  /** 叶子节点是否在当前 active 路径下（用于默认展开） */
  function leafMatchesActive(node, activeId) {
    if (node.href && node.id === activeId) return true;
    if (node.children) {
      return node.children.some(function (c) {
        return leafMatchesActive(c, activeId);
      });
    }
    return false;
  }

  /**
   * @param {boolean} shellMode - true: 壳内 iframe 导航
   * @param {string} activeId
   */
  function renderMenuHtml(shellMode, activeId) {
    var brand =
      '<div class="admin-sidebar-brand">可视化管理系统<small>合江汉代画像石棺项目（二期）</small></div>';

    var homeActive = activeId === "dashboard";
    var homeHref = shellMode ? "#" : "dashboard.html";
    var homeAttrs = shellMode
      ? ' data-shell-href="dashboard.html" data-shell-id="dashboard"'
      : "";
    var home =
      '<div class="admin-sidebar-home">' +
      '<a role="treeitem" class="admin-menu-home' +
      (homeActive ? " is-active" : "") +
      '" href="' +
      homeHref +
      '"' +
      homeAttrs +
      '>' +
      '<span class="admin-menu-home-ico" aria-hidden="true">⌂</span>' +
      '<span class="admin-menu-home-text">首页概览</span>' +
      "</a>" +
      "</div>";

    var nav =
      '<nav class="admin-nav-scroll" aria-label="侧栏多级菜单"><ul class="admin-menu-tree" role="tree">';

    MENU_TREE.forEach(function (group, gi) {
      var groupOpen = group.children.some(function (c) {
        return leafMatchesActive(c, activeId);
      });
      nav += '<li class="admin-menu-group" role="none">';
      nav +=
        '<button type="button" class="admin-menu-l1-toggle' +
        (groupOpen ? " is-open" : "") +
        '" aria-expanded="' +
        groupOpen +
        '" data-menu-toggle="l1">';
      nav += '<span class="admin-menu-l1-text">' + escapeHtml(group.title) + "</span>";
      nav += '<span class="admin-menu-chevron" aria-hidden="true"></span>';
      nav += "</button>";
      nav +=
        '<div class="admin-menu-l1-panel' +
        (groupOpen ? " is-open" : "") +
        '" data-l1-panel="' +
        gi +
        '">';
      nav += renderLevel2(group.children, shellMode, activeId, 2);
      nav += "</div></li>";
    });

    nav += "</ul></nav>";
    return brand + home + nav;
  }

  function renderLevel2(nodes, shellMode, activeId, depth) {
    var ulClass = depth === 2 ? "admin-menu-l2" : "admin-menu-l3";
    var html = '<ul class="' + ulClass + '" role="group">';
    sortedMenuNodes(nodes).forEach(function (node) {
      if (node.href) {
        html += renderLeaf(node, shellMode, activeId, depth);
      } else if (node.children) {
        var subOpen = node.children.some(function (c) {
          return leafMatchesActive(c, activeId);
        });
        html += '<li class="admin-menu-subgroup" role="none">';
        html +=
          '<button type="button" class="admin-menu-l2-toggle' +
          (subOpen ? " is-open" : "") +
          '" aria-expanded="' +
          subOpen +
          '" data-menu-toggle="l2">';
        html += '<span>' + escapeHtml(node.title) + "</span>";
        html += '<span class="admin-menu-chevron sm" aria-hidden="true"></span>';
        html += "</button>";
        html +=
          '<div class="admin-menu-l2-panel' +
          (subOpen ? " is-open" : "") +
          '">' +
          renderLevel2(node.children, shellMode, activeId, depth + 1) +
          "</div>";
        html += "</li>";
      }
    });
    html += "</ul>";
    return html;
  }

  function renderLeaf(node, shellMode, activeId, depth) {
    var ov = readMenuOverrideMap();
    var ent = ov[node.id];
    if (ent && ent.hidden) return "";
    var label = ent && ent.label ? ent.label : node.label;
    var isActive = node.id === activeId;
    var cls = "admin-menu-link depth-" + depth + (isActive ? " is-active" : "");
    var html = '<li role="none"><a role="treeitem"';
    if (shellMode) {
      html += ' href="#" data-shell-href="' + escapeHtml(node.href) + '" data-shell-id="' + escapeHtml(node.id) + '"';
    } else {
      html += ' href="' + escapeHtml(node.href) + '"';
    }
    html += ' class="' + cls.trim() + '">' + escapeHtml(label) + "</a></li>";
    return html;
  }

  function renderSidebar(activeId) {
    return renderMenuHtml(false, activeId);
  }

  function renderShellSidebar(activeId) {
    return renderMenuHtml(true, activeId);
  }

  /** 绑定一级/二级折叠；在 innerHTML 之后调用 */
  function bindSidebarToggles(sidebarRoot) {
    if (!sidebarRoot) return;
    sidebarRoot.querySelectorAll("[data-menu-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = !btn.classList.contains("is-open");
        btn.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open);
        var panel = btn.nextElementSibling;
        if (panel && (panel.classList.contains("admin-menu-l1-panel") || panel.classList.contains("admin-menu-l2-panel"))) {
          panel.classList.toggle("is-open", open);
        }
      });
    });
  }

  function renderTopbar() {
    var dn = readProfileDisplayName();
    return (
      '<span class="user">' + escapeHtml(dn) + "（原型）</span>" +
      '<a href="profile.html">个人信息</a>' +
      '<a href="login.html">退出</a>'
    );
  }

  function renderShellTopbar() {
    var dn = readProfileDisplayName();
    return (
      '<span class="user">' + escapeHtml(dn) + "（原型）</span>" +
      '<a href="#" data-shell-href="profile.html" data-shell-id="profile">个人信息</a>' +
      '<a href="login.html" target="_top">退出</a>'
    );
  }

  function initTabs(root) {
    root = root || document;
    root.querySelectorAll("[data-admin-tabs]").forEach(function (box) {
      var tabs = box.querySelectorAll(".admin-tab");
      var panels = box.querySelectorAll(".admin-tab-panel");
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) {
            t.classList.toggle("is-active", t === tab);
          });
          var target = tab.getAttribute("data-tab");
          panels.forEach(function (p) {
            p.hidden = p.getAttribute("id") !== target;
          });
        });
      });
    });
  }

  var shellNav = { iframe: null, sidebar: null };

  function setShellActive(sidebar, id) {
    if (!sidebar) return;
    sidebar.querySelectorAll("a[data-shell-id]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-shell-id") === id);
    });
  }

  function initShell(opts) {
    opts = opts || {};
    var iframeId = opts.iframeId || "admin-iframe";
    var sidebarId = opts.sidebarId || "shell-sidebar";
    var topbarId = opts.topbarId || "shell-topbar";
    var defaultHref = opts.defaultHref || "dashboard.html";
    var defaultId = opts.defaultId || "dashboard";

    var iframe = document.getElementById(iframeId);
    var sidebar = document.getElementById(sidebarId);
    var topbar = document.getElementById(topbarId);
    if (!iframe || !sidebar || !topbar) return;

    shellNav.iframe = iframe;
    shellNav.sidebar = sidebar;

    sidebar.innerHTML = renderShellSidebar(defaultId);
    bindSidebarToggles(sidebar);
    topbar.innerHTML = renderShellTopbar();

    function navigate(href, activeId) {
      try {
        sessionStorage.setItem("adminShellActiveId", activeId || "");
      } catch (e) {}
      iframe.src = withEmbed(href);
      if (activeId) setShellActive(sidebar, activeId);
    }

    sidebar.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-shell-href]");
      if (!a) return;
      e.preventDefault();
      navigate(a.getAttribute("data-shell-href"), a.getAttribute("data-shell-id"));
    });

    topbar.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-shell-href]");
      if (!a) return;
      e.preventDefault();
      navigate(a.getAttribute("data-shell-href"), a.getAttribute("data-shell-id"));
    });

    navigate(defaultHref, defaultId);
  }

  function refreshShellNavigation() {
    var sidebar = document.getElementById("shell-sidebar");
    var topbar = document.getElementById("shell-topbar");
    var id = "dashboard";
    try {
      id = sessionStorage.getItem("adminShellActiveId") || "dashboard";
    } catch (e) {}
    if (sidebar) {
      sidebar.innerHTML = renderShellSidebar(id);
      bindSidebarToggles(sidebar);
      setShellActive(sidebar, id);
    }
    if (topbar) topbar.innerHTML = renderShellTopbar();
  }

  function shellNavigate(href, activeId) {
    if (!shellNav.iframe || !shellNav.sidebar) return;
    try {
      sessionStorage.setItem("adminShellActiveId", activeId || "");
    } catch (e) {}
    shellNav.iframe.src = withEmbed(href);
    if (activeId) setShellActive(shellNav.sidebar, activeId);
  }

  global.AdminLayout = {
    init: function (opts) {
      opts = opts || {};
      var active = opts.active || "dashboard";
      var side = document.getElementById("admin-sidebar");
      var top = document.getElementById("admin-topbar");
      if (side) {
        side.innerHTML = renderSidebar(active);
        bindSidebarToggles(side);
      }
      if (top) top.innerHTML = renderTopbar();
      initTabs(document);
    },
    initShell: initShell,
    refreshShellNavigation: refreshShellNavigation,
    shellNavigate: shellNavigate,
    initTabs: function (root) {
      initTabs(root || document);
    },
    withEmbed: withEmbed,
  };
})(typeof window !== "undefined" ? window : this);
