/**
 * 部门管理：多级部门增删改查（内存数据）
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
    var d = store().depts.find(function (x) {
      return x.id === pid;
    });
    return d ? d.name : "—";
  }

  function hasChildren(id) {
    return store().depts.some(function (d) {
      return d.parentId === id;
    });
  }

  function isDescendant(maybeDesc, ancestorId) {
    if (!maybeDesc || maybeDesc === ancestorId) return maybeDesc === ancestorId;
    var cur = store().depts.find(function (x) {
      return x.id === maybeDesc;
    });
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = store().depts.find(function (x) {
        return x.id === cur.parentId;
      });
    }
    return false;
  }

  function renderTable() {
    var tb = $("dept-tbody");
    if (!tb) return;
    var rows = U.treeRows(store().depts);
    if (!rows.length) {
      tb.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--admin-muted);padding:20px">暂无部门，请点击新增</td></tr>';
      return;
    }
    tb.innerHTML = rows
      .map(function (item) {
        var d = item.row;
        var lv = Math.min(item.level, 3);
        var indentClass = "org-table-indent" + (lv ? " org-table-indent--" + lv : "");
        return (
          "<tr data-id=\"" +
          U.escapeHtml(d.id) +
          "\">" +
          '<td><span class="' +
          indentClass +
          '">' +
          U.escapeHtml(d.name) +
          "</span></td>" +
          "<td>" +
          U.escapeHtml(parentName(d.parentId)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(String(d.sort != null ? d.sort : 0)) +
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
    var rows = U.treeRows(store().depts);
    var opts = '<option value="">（顶级部门）</option>';
    rows.forEach(function (item) {
      var d = item.row;
      if (excludeId && (d.id === excludeId || isDescendant(d.id, excludeId))) return;
      var prefix = new Array(item.level + 1).join("　");
      var sel = d.id === selectedId ? " selected" : "";
      opts +=
        '<option value="' +
        U.escapeHtml(d.id) +
        '"' +
        sel +
        ">" +
        U.escapeHtml(prefix + d.name) +
        "</option>";
    });
    return opts;
  }

  function openModal(isEdit, dept) {
    var bd = $("dept-modal");
    var title = $("dept-modal-title");
    if (!bd || !title) return;
    editingId = isEdit && dept ? dept.id : null;
    title.textContent = isEdit ? "编辑部门" : "新增部门";
    $("dept-f-name").value = dept ? dept.name : "";
    $("dept-f-sort").value = dept && dept.sort != null ? dept.sort : 1;
    $("dept-f-parent").innerHTML = parentOptionsHtml(editingId, dept ? dept.parentId || "" : "");
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    var bd = $("dept-modal");
    if (!bd) return;
    bd.hidden = true;
    bd.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function saveForm() {
    var name = ($("dept-f-name").value || "").trim();
    var sort = parseInt($("dept-f-sort").value, 10);
    var parentVal = $("dept-f-parent").value;
    var parentId = parentVal === "" ? null : parentVal;

    if (!name) {
      U.showToast("dept-toast", "请填写部门名称");
      return;
    }
    if (isNaN(sort)) sort = 0;

    var depts = store().depts;
    if (!editingId) {
      depts.push({
        id: U.nextStoreId("dept", "d"),
        name: name,
        parentId: parentId,
        sort: sort,
      });
      U.showToast("dept-toast", "已新增部门");
    } else {
      var d = depts.find(function (x) {
        return x.id === editingId;
      });
      if (d) {
        if (parentId && isDescendant(parentId, d.id)) {
          U.showToast("dept-toast", "不能将上级设为自己的下级");
          return;
        }
        d.name = name;
        d.parentId = parentId;
        d.sort = sort;
      }
      U.showToast("dept-toast", "已保存");
    }
    closeModal();
    renderTable();
  }

  function deleteDept(id) {
    if (hasChildren(id)) {
      U.showToast("dept-toast", "请先删除或调整下级部门");
      return;
    }
    var users = store().users;
    if (users.some(function (u) {
      return u.deptId === id;
    })) {
      U.showToast("dept-toast", "仍有用户归属该部门，请先在用户管理中调整");
      return;
    }
    if (!window.confirm("确定删除该部门？")) return;
    var depts = store().depts;
    var idx = depts.findIndex(function (x) {
      return x.id === id;
    });
    if (idx >= 0) depts.splice(idx, 1);
    U.showToast("dept-toast", "已删除");
    renderTable();
  }

  function init() {
    $("dept-btn-add") &&
      $("dept-btn-add").addEventListener("click", function () {
        openModal(false, null);
      });
    $("dept-btn-save") && $("dept-btn-save").addEventListener("click", saveForm);
    U.bindModalClose("dept-modal", closeModal);

    var tb = $("dept-tbody");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        var id = tr.getAttribute("data-id");
        var d = store().depts.find(function (x) {
          return x.id === id;
        });
        if (btn.getAttribute("data-act") === "edit") {
          if (d) openModal(true, d);
        } else if (btn.getAttribute("data-act") === "del") {
          deleteDept(id);
        }
      });
    }

    renderTable();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
