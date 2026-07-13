/**
 * 岗位管理：多级岗位 + 权限勾选，增删改查
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
    var p = store().posts.find(function (x) {
      return x.id === pid;
    });
    return p ? p.name : "—";
  }

  function hasChildren(id) {
    return store().posts.some(function (p) {
      return p.parentId === id;
    });
  }

  function isDescendant(maybeDesc, ancestorId) {
    if (!maybeDesc || maybeDesc === ancestorId) return maybeDesc === ancestorId;
    var cur = store().posts.find(function (x) {
      return x.id === maybeDesc;
    });
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = store().posts.find(function (x) {
        return x.id === cur.parentId;
      });
    }
    return false;
  }

  function permSummary(ids) {
    var menus = window.OrgPermissionMenus || [];
    if (!ids || !ids.length) return "—";
    var labels = ids
      .map(function (id) {
        var m = menus.find(function (x) {
          return x.id === id;
        });
        return m ? m.label : id;
      })
      .slice(0, 2);
    var more = ids.length > 2 ? " 等" + ids.length + "项" : "";
    return labels.join("；") + more;
  }

  function renderTable() {
    var tb = $("post-tbody");
    if (!tb) return;
    var rows = U.treeRows(store().posts);
    if (!rows.length) {
      tb.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--admin-muted);padding:20px">暂无岗位</td></tr>';
      return;
    }
    tb.innerHTML = rows
      .map(function (item) {
        var p = item.row;
        var lv = Math.min(item.level, 3);
        var indentClass = "org-table-indent" + (lv ? " org-table-indent--" + lv : "");
        return (
          "<tr data-id=\"" +
          U.escapeHtml(p.id) +
          "\">" +
          '<td><span class="' +
          indentClass +
          '">' +
          U.escapeHtml(p.name) +
          "</span></td>" +
          "<td>" +
          U.escapeHtml(parentName(p.parentId)) +
          "</td>" +
          "<td style=\"max-width:280px;word-break:break-all\">" +
          U.escapeHtml(permSummary(p.permissionIds)) +
          "</td>" +
          "<td>" +
          '<button type="button" class="btn btn-ghost" data-act="edit">编辑</button> ' +
          '<button type="button" class="btn btn-danger" data-act="del">删除</button>' +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function parentOptionsHtml(excludeId, selectedId) {
    var rows = U.treeRows(store().posts);
    var opts = '<option value="">（顶级岗位）</option>';
    rows.forEach(function (item) {
      var p = item.row;
      if (excludeId && (p.id === excludeId || isDescendant(p.id, excludeId))) return;
      var prefix = new Array(item.level + 1).join("　");
      var sel = p.id === selectedId ? " selected" : "";
      opts +=
        '<option value="' +
        U.escapeHtml(p.id) +
        '"' +
        sel +
        ">" +
        U.escapeHtml(prefix + p.name) +
        "</option>";
    });
    return opts;
  }

  function renderModalPermChecks(ids) {
    var wrap = $("post-perm-wrap");
    if (!wrap) return;
    var menus = window.OrgPermissionMenus || [];
    ids = ids || [];
    wrap.innerHTML =
      '<div class="org-perm-grid">' +
      menus
        .map(function (m) {
          var chk = ids.indexOf(m.id) >= 0 ? " checked" : "";
          return (
            '<label class="org-perm-item"><input type="checkbox" name="postPerm" value="' +
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

  function openModal(isEdit, post) {
    var bd = $("post-modal");
    var title = $("post-modal-title");
    if (!bd || !title) return;
    editingId = isEdit && post ? post.id : null;
    title.textContent = isEdit ? "编辑岗位" : "新增岗位";
    $("post-f-name").value = post ? post.name : "";
    $("post-f-remark").value = post ? post.remark || "" : "";
    $("post-f-sort").value = post && post.sort != null ? post.sort : 1;
    $("post-f-parent").innerHTML = parentOptionsHtml(editingId, post ? post.parentId || "" : "");
    renderModalPermChecks(post ? post.permissionIds : []);
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    var bd = $("post-modal");
    if (!bd) return;
    bd.hidden = true;
    bd.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function readPostPerms() {
    return Array.prototype.slice
      .call(document.querySelectorAll('input[name="postPerm"]:checked'))
      .map(function (el) {
        return el.value;
      });
  }

  function saveForm() {
    var name = ($("post-f-name").value || "").trim();
    var remark = ($("post-f-remark").value || "").trim();
    var sort = parseInt($("post-f-sort").value, 10);
    var parentVal = $("post-f-parent").value;
    var parentId = parentVal === "" ? null : parentVal;
    var permissionIds = readPostPerms();
    if (isNaN(sort)) sort = 0;

    if (!name) {
      U.showToast("post-toast", "请填写岗位名称");
      return;
    }

    var posts = store().posts;
    if (!editingId) {
      posts.push({
        id: U.nextStoreId("post", "p"),
        name: name,
        parentId: parentId,
        sort: sort,
        remark: remark,
        permissionIds: permissionIds,
      });
      U.showToast("post-toast", "已新增岗位");
    } else {
      var p = posts.find(function (x) {
        return x.id === editingId;
      });
      if (p) {
        if (parentId && isDescendant(parentId, p.id)) {
          U.showToast("post-toast", "不能将上级设为自己的下级");
          return;
        }
        p.name = name;
        p.remark = remark;
        p.parentId = parentId;
        p.sort = sort;
        p.permissionIds = permissionIds;
      }
      U.showToast("post-toast", "已保存");
    }
    closeModal();
    renderTable();
  }

  function deletePost(id) {
    if (hasChildren(id)) {
      U.showToast("post-toast", "请先删除或调整下级岗位");
      return;
    }
    var users = store().users;
    if (users.some(function (u) {
      return u.postIds && u.postIds.indexOf(id) >= 0;
    })) {
      U.showToast("post-toast", "仍有用户关联该岗位，请先在用户管理中调整");
      return;
    }
    if (!window.confirm("确定删除该岗位？")) return;
    var posts = store().posts;
    var idx = posts.findIndex(function (x) {
      return x.id === id;
    });
    if (idx >= 0) posts.splice(idx, 1);
    U.showToast("post-toast", "已删除");
    renderTable();
  }

  function init() {
    $("post-btn-add") &&
      $("post-btn-add").addEventListener("click", function () {
        openModal(false, null);
      });
    $("post-btn-save") && $("post-btn-save").addEventListener("click", saveForm);
    U.bindModalClose("post-modal", closeModal);

    var tb = $("post-tbody");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        var id = tr.getAttribute("data-id");
        var p = store().posts.find(function (x) {
          return x.id === id;
        });
        if (btn.getAttribute("data-act") === "edit") {
          if (p) openModal(true, p);
        } else if (btn.getAttribute("data-act") === "del") {
          deletePost(id);
        }
      });
    }

    renderTable();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
