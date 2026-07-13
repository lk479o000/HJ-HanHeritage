/**
 * 用户管理：搜索、增删改（数据来自 OrgAdminStore）
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;
  var store = function () {
    return window.OrgAdminStore;
  };

  var editingId = null;
  var searchKeyword = "";

  function deptName(id) {
    var d = store().depts.find(function (x) {
      return x.id === id;
    });
    return d ? d.name : "—";
  }

  function roleNames(ids) {
    if (!ids || !ids.length) return "—";
    return ids
      .map(function (rid) {
        var r = store().roles.find(function (x) {
          return x.id === rid;
        });
        return r ? r.name : rid;
      })
      .join("、");
  }

  function postNames(ids) {
    if (!ids || !ids.length) return "—";
    return ids
      .map(function (pid) {
        var p = store().posts.find(function (x) {
          return x.id === pid;
        });
        return p ? p.name : pid;
      })
      .join("、");
  }

  function filteredUsers() {
    var kw = searchKeyword.trim().toLowerCase();
    return store().users.filter(function (u) {
      if (!kw) return true;
      return (
        String(u.realName || "").toLowerCase().indexOf(kw) >= 0 ||
        String(u.phone || "").indexOf(kw) >= 0
      );
    });
  }

  function renderTable() {
    var tb = $("user-tbody");
    if (!tb) return;
    var list = filteredUsers();
    if (!list.length) {
      tb.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--admin-muted);padding:20px">暂无数据</td></tr>';
      return;
    }
    tb.innerHTML = list
      .map(function (u) {
        var stLabel = u.status === "disabled" ? "停用" : "正常";
        return (
          "<tr data-id=\"" +
          U.escapeHtml(u.id) +
          "\">" +
          "<td>" +
          U.escapeHtml(u.realName || "—") +
          "</td>" +
          "<td>" +
          U.escapeHtml(deptName(u.deptId)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(roleNames(u.roleIds)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(postNames(u.postIds)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(stLabel) +
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

  function deptOptionsHtml(selectedId) {
    return store()
      .depts.map(function (d) {
        var sel = d.id === selectedId ? " selected" : "";
        return '<option value="' + U.escapeHtml(d.id) + '"' + sel + ">" + U.escapeHtml(d.name) + "</option>";
      })
      .join("");
  }

  function roleChecksHtml(roleIds) {
    roleIds = roleIds || [];
    return store()
      .roles
      .map(function (r) {
        var chk = roleIds.indexOf(r.id) >= 0 ? " checked" : "";
        return (
          '<label class="org-perm-item"><input type="checkbox" name="roleId" value="' +
          U.escapeHtml(r.id) +
          '"' +
          chk +
          " /><span>" +
          U.escapeHtml(r.name) +
          "</span></label>"
        );
      })
      .join("");
  }

  function postChecksHtml(postIds) {
    postIds = postIds || [];
    return store()
      .posts
      .map(function (p) {
        var chk = postIds.indexOf(p.id) >= 0 ? " checked" : "";
        return (
          '<label class="org-perm-item"><input type="checkbox" name="postId" value="' +
          U.escapeHtml(p.id) +
          '"' +
          chk +
          " /><span>" +
          U.escapeHtml(p.name) +
          "</span></label>"
        );
      })
      .join("");
  }

  function openModal(isEdit, user) {
    var bd = $("user-modal");
    var title = $("user-modal-title");
    if (!bd || !title) return;
    editingId = isEdit && user ? user.id : null;
    title.textContent = isEdit ? "编辑用户" : "新增用户";
    $("user-f-realname").value = user ? user.realName || "" : "";
    $("user-f-phone").value = user ? user.phone || "" : "";
    $("user-f-dept").innerHTML = deptOptionsHtml(user ? user.deptId : store().depts[0] && store().depts[0].id);
    $("user-f-status").value = user && user.status === "disabled" ? "disabled" : "enabled";
    $("user-role-wrap").innerHTML =
      '<div class="org-perm-grid">' + roleChecksHtml(user ? user.roleIds : []) + "</div>";
    $("user-post-wrap").innerHTML =
      '<div class="org-perm-grid">' + postChecksHtml(user ? user.postIds : []) + "</div>";
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    var bd = $("user-modal");
    if (!bd) return;
    bd.hidden = true;
    bd.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function readChecked(name) {
    return Array.prototype.slice
      .call(document.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (el) {
        return el.value;
      });
  }

  function saveForm() {
    var realName = ($("user-f-realname").value || "").trim();
    var phone = ($("user-f-phone").value || "").trim();
    var deptId = $("user-f-dept").value;
    var status = $("user-f-status").value;
    var roleIds = readChecked("roleId");
    var postIds = readChecked("postId");

    if (!realName) {
      U.showToast("user-toast", "请填写姓名");
      return;
    }
    if (!deptId) {
      U.showToast("user-toast", "请选择部门");
      return;
    }

    var users = store().users;
    function phoneTaken(byId) {
      if (!phone) return false;
      return users.some(function (u) {
        return u.id !== byId && u.phone && u.phone === phone;
      });
    }

    if (!editingId) {
      if (phoneTaken(null)) {
        U.showToast("user-toast", "该手机号已被使用");
        return;
      }
      users.push({
        id: U.nextStoreId("user", "u"),
        realName: realName,
        phone: phone,
        deptId: deptId,
        roleIds: roleIds,
        postIds: postIds,
        status: status,
      });
      U.showToast("user-toast", "已新增用户");
    } else {
      var u = users.find(function (x) {
        return x.id === editingId;
      });
      if (u) {
        if (phoneTaken(u.id)) {
          U.showToast("user-toast", "该手机号已被使用");
          return;
        }
        u.realName = realName;
        u.phone = phone;
        u.deptId = deptId;
        u.roleIds = roleIds;
        u.postIds = postIds;
        u.status = status;
      }
      U.showToast("user-toast", "已保存修改");
    }
    closeModal();
    renderTable();
  }

  function deleteUser(id) {
    var users = store().users;
    var idx = users.findIndex(function (x) {
      return x.id === id;
    });
    if (idx < 0) return;
    if (!window.confirm("确定删除该用户？")) return;
    users.splice(idx, 1);
    U.showToast("user-toast", "已删除");
    renderTable();
  }

  function init() {
    var addBtn = $("user-btn-add");
    var searchBtn = $("user-btn-search");
    var resetBtn = $("user-btn-reset");
    var searchInput = $("user-search");

    if (addBtn)
      addBtn.addEventListener("click", function () {
        if (!store().depts.length) {
          U.showToast("user-toast", "请先在部门管理中维护部门");
          return;
        }
        openModal(false, null);
      });

    if (searchBtn)
      searchBtn.addEventListener("click", function () {
        searchKeyword = searchInput ? searchInput.value : "";
        renderTable();
      });

    if (resetBtn)
      resetBtn.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        searchKeyword = "";
        renderTable();
      });

    if (searchInput) {
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          searchKeyword = searchInput.value;
          renderTable();
        }
      });
    }

    var tb = $("user-tbody");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        var id = tr.getAttribute("data-id");
        var u = store().users.find(function (x) {
          return x.id === id;
        });
        if (btn.getAttribute("data-act") === "edit") {
          if (u) openModal(true, u);
        } else if (btn.getAttribute("data-act") === "del") {
          deleteUser(id);
        }
      });
    }

    $("user-btn-save") && $("user-btn-save").addEventListener("click", saveForm);
    U.bindModalClose("user-modal", closeModal);

    renderTable();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
