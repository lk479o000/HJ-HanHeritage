/**
 * 菜单管理：树形表格、筛选、排序、改名称、新增子级/顶级、删除
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;
  var Store = window.SysConfigStore;

  var expanded = {};
  var filterName = "";
  var filterStatus = "all";
  var editingId = null;
  var addParentId = null;

  function tryRefreshShell() {
    try {
      if (window.parent && window.parent !== window && window.parent.AdminLayout && window.parent.AdminLayout.refreshShellNavigation) {
        window.parent.AdminLayout.refreshShellNavigation();
      }
    } catch (e) {}
  }

  function filterTree(nodes) {
    var kw = filterName.trim().toLowerCase();
    return (nodes || [])
      .map(function walk(n) {
        var sub = (n.children || []).map(walk).filter(Boolean);
        var nameOk = !kw || String(n.name).toLowerCase().indexOf(kw) >= 0;
        var stOk = filterStatus === "all" || n.status === filterStatus;
        var local = nameOk && stOk;
        if (local || sub.length) {
          var nn = Object.assign({}, n, { children: sub });
          if (!local && sub.length) return nn;
          if (local) return nn;
        }
        return null;
      })
      .filter(Boolean);
  }

  function setDefaultExpanded(nodes) {
    (nodes || []).forEach(function w(n) {
      if ((n.children || []).length) {
        if (expanded[n.id] === undefined) expanded[n.id] = true;
        n.children.forEach(w);
      }
    });
  }

  function setAllExpanded(nodes, val) {
    (nodes || []).forEach(function w(n) {
      if ((n.children || []).length) {
        expanded[n.id] = val;
        n.children.forEach(w);
      }
    });
  }

  function sortSiblings(arr) {
    return (arr || []).slice().sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0);
    });
  }

  function renderRows(nodes, level) {
    var html = "";
    sortSiblings(nodes).forEach(function (n) {
      var children = n.children || [];
      var hasCh = children.length > 0;
      var isOpen = !hasCh || expanded[n.id] !== false;

      var indentPx = level * 18;
      var toggleBtn = hasCh
        ? '<button type="button" class="menu-tree-toggle" data-tree-toggle="' +
          U.escapeHtml(n.id) +
          '" aria-expanded="' +
          isOpen +
          '">' +
          (isOpen ? "▼" : "▶") +
          "</button>"
        : '<span class="menu-tree-toggle is-placeholder">·</span>';

      var stHtml =
        n.status === "disabled"
          ? '<span class="tag tag-warn">停用</span>'
          : '<span class="tag">正常</span>';

      html +=
        "<tr data-id=\"" +
        U.escapeHtml(n.id) +
        "\">" +
        "<td>" +
        '<div class="menu-tree-name-wrap">' +
        '<span class="menu-tree-indent" style="width:' +
        indentPx +
        'px"></span>' +
        toggleBtn +
        '<span class="menu-name-text">' +
        U.escapeHtml(n.name) +
        "</span>" +
        "</div>" +
        "</td>" +
        "<td><span class=\"menu-icon-pill\">" +
        U.escapeHtml(n.icon || "—") +
        "</span></td>" +
        "<td><input type=\"number\" class=\"admin-input menu-sort-input\" value=\"" +
        U.escapeHtml(String(n.sort != null ? n.sort : 0)) +
        "\" /></td>" +
        "<td><code style=\"font-size:0.78rem\">" +
        U.escapeHtml(n.perms || "—") +
        "</code></td>" +
        "<td><code style=\"font-size:0.78rem;word-break:break-all\">" +
        U.escapeHtml(n.component || "—") +
        "</code></td>" +
        "<td>" +
        stHtml +
        "</td>" +
        "<td>" +
        U.escapeHtml(n.createTime || "—") +
        "</td>" +
        '<td class="menu-table-actions">' +
        '<button type="button" class="btn btn-ghost" data-act="edit">修改</button>' +
        '<button type="button" class="btn btn-ghost" data-act="add">新增</button>' +
        '<button type="button" class="btn btn-danger" data-act="del">删除</button>' +
        "</td>" +
        "</tr>";

      if (hasCh && isOpen) html += renderRows(children, level + 1);
    });
    return html;
  }

  function render() {
    var tb = $("menu-tbody");
    if (!tb || !Store) return;
    var tree = Store.getMenuTree();
    setDefaultExpanded(tree);
    var filtered = filterTree(tree);
    if (!filtered.length) {
      tb.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:var(--admin-muted);padding:24px">无匹配菜单</td></tr>';
      return;
    }
    tb.innerHTML = renderRows(filtered, 0);
  }

  function openEditModal(id) {
    var n = Store.getMenuNode(id);
    if (!n) return;
    editingId = id;
    addParentId = null;
    $("menu-form-title").textContent = "修改菜单";
    $("menu-f-name").value = n.name || "";
    $("menu-f-sort").value = n.sort != null ? n.sort : 0;
    $("menu-f-icon").value = n.icon || "";
    $("menu-f-perms").value = n.perms || "";
    $("menu-f-component").value = n.component || "";
    $("menu-f-status").value = n.status === "disabled" ? "disabled" : "normal";
    $("menu-f-link").value = n.linkId || "";
    $("menu-f-link").disabled = true;
    $("menu-link-hint").hidden = false;
    var bd = $("menu-form-modal");
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function openAddModal(parentId) {
    editingId = null;
    addParentId = parentId;
    $("menu-form-title").textContent = parentId ? "新增子菜单" : "新增顶级菜单";
    $("menu-f-name").value = "";
    $("menu-f-sort").value = "0";
    $("menu-f-icon").value = "menu";
    $("menu-f-perms").value = "";
    $("menu-f-component").value = "";
    $("menu-f-status").value = "normal";
    $("menu-f-link").value = "";
    $("menu-f-link").disabled = false;
    $("menu-link-hint").hidden = false;
    var bd = $("menu-form-modal");
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function closeFormModal() {
    var bd = $("menu-form-modal");
    if (!bd) return;
    bd.hidden = true;
    bd.setAttribute("aria-hidden", "true");
    editingId = null;
    addParentId = null;
  }

  function saveFormModal() {
    var name = ($("menu-f-name").value || "").trim();
    if (!name) {
      U.showToast("menu-toast", "请填写菜单名称");
      return;
    }
    var sort = parseInt($("menu-f-sort").value, 10);
    if (isNaN(sort)) sort = 0;
    var icon = ($("menu-f-icon").value || "").trim();
    var perms = ($("menu-f-perms").value || "").trim();
    var component = ($("menu-f-component").value || "").trim();
    var status = $("menu-f-status").value === "disabled" ? "disabled" : "normal";
    var linkIdRaw = ($("menu-f-link").value || "").trim();

    if (editingId) {
      Store.updateMenuNode(editingId, {
        name: name,
        sort: sort,
        icon: icon,
        perms: perms,
        component: component,
        status: status,
      });
      U.showToast("menu-toast", "已保存");
    } else {
      Store.addMenuNode(addParentId, {
        name: name,
        sort: sort,
        icon: icon,
        perms: perms,
        component: component,
        status: status,
        linkId: linkIdRaw || null,
      });
      U.showToast("menu-toast", "已新增");
    }
    closeFormModal();
    render();
    tryRefreshShell();
  }

  function saveSortFromTable() {
    var tb = $("menu-tbody");
    if (!tb || !Store) return;
    tb.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var inp = tr.querySelector(".menu-sort-input");
      if (!id || !inp) return;
      var n = parseInt(inp.value, 10);
      if (!isNaN(n)) Store.updateMenuNode(id, { sort: n });
    });
    U.showToast("menu-toast", "已保存排序");
    render();
    tryRefreshShell();
  }

  function deleteNode(id) {
    var n = Store.getMenuNode(id);
    if (!n) return;
    var msg = "确定删除「" + n.name + "」？";
    if ((n.children || []).length) msg += " 将同时删除其下子菜单。";
    if (!window.confirm(msg)) return;
    Store.deleteMenuNode(id);
    delete expanded[id];
    U.showToast("menu-toast", "已删除");
    render();
    tryRefreshShell();
  }

  function init() {
    $("menu-search") &&
      $("menu-search").addEventListener("click", function () {
        filterName = ($("menu-filter-name") && $("menu-filter-name").value) || "";
        filterStatus = ($("menu-filter-status") && $("menu-filter-status").value) || "all";
        render();
      });
    $("menu-reset") &&
      $("menu-reset").addEventListener("click", function () {
        if ($("menu-filter-name")) $("menu-filter-name").value = "";
        if ($("menu-filter-status")) $("menu-filter-status").value = "all";
        filterName = "";
        filterStatus = "all";
        render();
      });
    $("menu-filter-name") &&
      $("menu-filter-name").addEventListener("keydown", function (e) {
        if (e.key === "Enter") $("menu-search").click();
      });

    $("menu-add-root") &&
      $("menu-add-root").addEventListener("click", function () {
        openAddModal(null);
      });
    $("menu-expand-all") &&
      $("menu-expand-all").addEventListener("click", function () {
        setAllExpanded(Store.getMenuTree(), true);
        render();
      });
    $("menu-collapse-all") &&
      $("menu-collapse-all").addEventListener("click", function () {
        setAllExpanded(Store.getMenuTree(), false);
        render();
      });
    $("menu-save-sort") && $("menu-save-sort").addEventListener("click", saveSortFromTable);
    $("menu-form-save") && $("menu-form-save").addEventListener("click", saveFormModal);
    U.bindModalClose("menu-form-modal", closeFormModal);

    var tb = $("menu-tbody");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var tgl = e.target.closest("[data-tree-toggle]");
        if (tgl) {
          var tid = tgl.getAttribute("data-tree-toggle");
          expanded[tid] = expanded[tid] === false;
          render();
          return;
        }
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        var id = tr.getAttribute("data-id");
        var act = btn.getAttribute("data-act");
        if (act === "edit") openEditModal(id);
        else if (act === "add") openAddModal(id);
        else if (act === "del") deleteNode(id);
      });
    }

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
