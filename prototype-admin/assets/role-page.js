/**
 * 角色管理：多级角色 + 权限配置 Tab（菜单勾选、数据范围）
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;

  function store() {
    return window.OrgAdminStore;
  }

  var editingId = null;

  function parentName(pid) {
    if (pid == null || pid === "") return "—";
    var r = store().roles.find(function (x) {
      return x.id === pid;
    });
    return r ? r.name : "—";
  }

  function hasChildRoles(id) {
    return store().roles.some(function (r) {
      return r.parentId === id;
    });
  }

  function isDescendant(maybeDesc, ancestorId) {
    if (!maybeDesc || maybeDesc === ancestorId) return maybeDesc === ancestorId;
    var cur = store().roles.find(function (x) {
      return x.id === maybeDesc;
    });
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = store().roles.find(function (x) {
        return x.id === cur.parentId;
      });
    }
    return false;
  }

  function renderRoleTable() {
    var tb = $("role-tbody");
    if (!tb) return;
    var rows = U.treeRows(store().roles);
    if (!rows.length) {
      tb.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:var(--admin-muted);padding:20px">暂无角色</td></tr>';
      return;
    }
    tb.innerHTML = rows
      .map(function (item) {
        var r = item.row;
        var lv = Math.min(item.level, 3);
        var indentClass = "org-table-indent" + (lv ? " org-table-indent--" + lv : "");
        var permCount = (r.permissionIds && r.permissionIds.length) || 0;
        return (
          "<tr data-id=\"" +
          U.escapeHtml(r.id) +
          "\">" +
          '<td><span class="' +
          indentClass +
          '">' +
          U.escapeHtml(r.name) +
          "</span></td>" +
          "<td>" +
          U.escapeHtml(r.code || "—") +
          "</td>" +
          "<td>" +
          U.escapeHtml(parentName(r.parentId)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(String(permCount) + " 项") +
          "</td>" +
          "<td>" +
          '<button type="button" class="btn btn-ghost" data-act="edit">编辑</button> ' +
          '<button type="button" class="btn btn-ghost" data-act="perm">配置权限</button> ' +
          '<button type="button" class="btn btn-danger" data-act="del">删除</button>' +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function parentRoleOptionsHtml(excludeId, selectedId) {
    var rows = U.treeRows(store().roles);
    var opts = '<option value="">（顶级角色）</option>';
    rows.forEach(function (item) {
      var r = item.row;
      if (excludeId && (r.id === excludeId || isDescendant(r.id, excludeId))) return;
      var prefix = new Array(item.level + 1).join("　");
      var sel = r.id === selectedId ? " selected" : "";
      opts +=
        '<option value="' +
        U.escapeHtml(r.id) +
        '"' +
        sel +
        ">" +
        U.escapeHtml(prefix + r.name) +
        "</option>";
    });
    return opts;
  }

  function openRoleModal(isEdit, role) {
    var bd = $("role-modal");
    var title = $("role-modal-title");
    if (!bd || !title) return;
    editingId = isEdit && role ? role.id : null;
    title.textContent = isEdit ? "编辑角色" : "新增角色";
    $("role-f-name").value = role ? role.name : "";
    $("role-f-code").value = role ? role.code || "" : "";
    $("role-f-remark").value = role ? role.remark || "" : "";
    $("role-f-parent").innerHTML = parentRoleOptionsHtml(editingId, role ? role.parentId || "" : "");
    $("role-f-sort").value = role && role.sort != null ? role.sort : 1;
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function closeRoleModal() {
    var bd = $("role-modal");
    if (!bd) return;
    bd.hidden = true;
    bd.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function saveRoleForm() {
    var name = ($("role-f-name").value || "").trim();
    var code = ($("role-f-code").value || "").trim();
    var remark = ($("role-f-remark").value || "").trim();
    var parentVal = $("role-f-parent").value;
    var parentId = parentVal === "" ? null : parentVal;
    var sort = parseInt($("role-f-sort").value, 10);
    if (isNaN(sort)) sort = 0;

    if (!name) {
      U.showToast("role-toast", "请填写角色名称");
      return;
    }

    var roles = store().roles;
    if (!editingId) {
      roles.push({
        id: U.nextStoreId("role", "r"),
        name: name,
        code: code,
        remark: remark,
        parentId: parentId,
        sort: sort,
        dataScope: "dept",
        permissionIds: [],
      });
      U.showToast("role-toast", "已新增角色");
    } else {
      var r = roles.find(function (x) {
        return x.id === editingId;
      });
      if (r) {
        if (parentId && isDescendant(parentId, r.id)) {
          U.showToast("role-toast", "不能将上级设为自己的下级");
          return;
        }
        r.name = name;
        r.code = code;
        r.remark = remark;
        r.parentId = parentId;
        r.sort = sort;
      }
      U.showToast("role-toast", "已保存");
    }
    closeRoleModal();
    renderRoleTable();
    fillPermRoleSelect();
  }

  function deleteRole(id) {
    if (hasChildRoles(id)) {
      U.showToast("role-toast", "请先删除或调整子角色");
      return;
    }
    var users = store().users;
    if (users.some(function (u) {
      return u.roleIds && u.roleIds.indexOf(id) >= 0;
    })) {
      U.showToast("role-toast", "仍有用户持有该角色，请先在用户管理中调整");
      return;
    }
    if (!window.confirm("确定删除该角色？")) return;
    var roles = store().roles;
    var idx = roles.findIndex(function (x) {
      return x.id === id;
    });
    if (idx >= 0) roles.splice(idx, 1);
    U.showToast("role-toast", "已删除");
    renderRoleTable();
    fillPermRoleSelect();
    loadPermForm();
  }

  function fillPermRoleSelect() {
    var sel = $("role-perm-select");
    if (!sel) return;
    var rows = U.treeRows(store().roles);
    var cur = sel.value;
    sel.innerHTML = rows
      .map(function (item) {
        var r = item.row;
        var prefix = new Array(item.level + 1).join("　");
        return (
          '<option value="' +
          U.escapeHtml(r.id) +
          '">' +
          U.escapeHtml(prefix + r.name) +
          "</option>"
        );
      })
      .join("");
    if (cur && store().roles.some(function (x) {
      return x.id === cur;
    }))
      sel.value = cur;
    else if (sel.options.length) sel.selectedIndex = 0;
  }

  function getSelectedRole() {
    var sel = $("role-perm-select");
    if (!sel || !sel.value) return null;
    return store().roles.find(function (x) {
      return x.id === sel.value;
    });
  }

  function renderPermCheckboxes(role) {
    var wrap = $("role-perm-menus");
    if (!wrap) return;
    var menus = window.OrgPermissionMenus || [];
    var ids = (role && role.permissionIds) || [];
    wrap.innerHTML =
      '<div class="org-perm-grid">' +
      menus
        .map(function (m) {
          var chk = ids.indexOf(m.id) >= 0 ? " checked" : "";
          return (
            '<label class="org-perm-item"><input type="checkbox" name="permMenu" value="' +
            U.escapeHtml(m.id) +
            '"' +
            chk +
            " /><span>" +
            U.escapeHtml(m.label) +
            "</span></label>"
          );
        })
        .join("") +
      "</div>";
  }

  function loadPermForm() {
    var role = getSelectedRole();
    var hint = $("role-perm-role-hint");
    if (hint) hint.textContent = role ? "当前：" + role.name + "（编码 " + (role.code || "—") + "）" : "";
    renderPermCheckboxes(role);
    var ds = $("role-perm-datascope");
    if (ds && role) {
      var v = role.dataScope || "dept";
      if (["all", "dept", "custom"].indexOf(v) < 0) v = "dept";
      ds.value = v;
    }
  }

  function savePermForm() {
    var role = getSelectedRole();
    if (!role) {
      U.showToast("role-toast", "请选择角色");
      return;
    }
    var checked = Array.prototype.slice
      .call(document.querySelectorAll('input[name="permMenu"]:checked'))
      .map(function (el) {
        return el.value;
      });
    role.permissionIds = checked;
    var ds = $("role-perm-datascope");
    if (ds) role.dataScope = ds.value;
    U.showToast("role-toast", "权限已保存到当前角色（内存）");
    renderRoleTable();
  }

  function switchToPermTab() {
    var tabs = document.querySelector("[data-admin-tabs]");
    if (!tabs) return;
    var tabBtns = tabs.querySelectorAll(".admin-tab");
    var panels = tabs.querySelectorAll(".admin-tab-panel");
    tabBtns.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-tab") === "r2");
    });
    panels.forEach(function (p) {
      p.hidden = p.id !== "r2";
    });
  }

  function init() {
    $("role-btn-add") &&
      $("role-btn-add").addEventListener("click", function () {
        openRoleModal(false, null);
      });
    $("role-btn-save") && $("role-btn-save").addEventListener("click", saveRoleForm);
    U.bindModalClose("role-modal", closeRoleModal);

    $("role-tbody") &&
      $("role-tbody").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        var id = tr.getAttribute("data-id");
        var r = store().roles.find(function (x) {
          return x.id === id;
        });
        var act = btn.getAttribute("data-act");
        if (act === "edit") {
          if (r) openRoleModal(true, r);
        } else if (act === "del") {
          deleteRole(id);
        } else if (act === "perm") {
          fillPermRoleSelect();
          var sel = $("role-perm-select");
          if (sel && r) sel.value = r.id;
          loadPermForm();
          switchToPermTab();
        }
      });

    fillPermRoleSelect();
    $("role-perm-select") &&
      $("role-perm-select").addEventListener("change", function () {
        loadPermForm();
      });
    $("role-perm-save") && $("role-perm-save").addEventListener("click", savePermForm);

    renderRoleTable();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
