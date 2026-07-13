/**
 * 通知公告：发布、编辑、删除、上线/下线
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;
  var Store = window.SysConfigStore;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function fmtDate(ms) {
    if (ms == null || !ms) return "—";
    var d = new Date(ms);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  var editingId = null;

  function render() {
    var tb = $("notice-tbody");
    if (!tb || !Store) return;
    var list = Store.getNoticesSorted();
    if (!list.length) {
      tb.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:var(--admin-muted);padding:20px">暂无公告</td></tr>';
      return;
    }
    tb.innerHTML = list
      .map(function (n) {
        var stTag =
          n.status === "published"
            ? '<span class="tag">已发布</span>'
            : '<span class="tag tag-warn">草稿</span>';
        var pub = fmtDate(n.publishedAt);
        var scope = scopeText(n.scope);
        return (
          "<tr data-id=\"" +
          U.escapeHtml(n.id) +
          "\">" +
          "<td>" +
          U.escapeHtml(n.title) +
          "</td>" +
          "<td>" +
          stTag +
          "</td>" +
          "<td>" +
          U.escapeHtml(pub) +
          "</td>" +
          "<td>" +
          U.escapeHtml(scope) +
          "</td>" +
          "<td>" +
          '<button type="button" class="btn btn-ghost" data-act="edit">编辑</button> ' +
          (n.status === "published"
            ? '<button type="button" class="btn btn-ghost" data-act="offline">下线</button> '
            : '<button type="button" class="btn btn-primary" data-act="publish">发布</button> ') +
          '<button type="button" class="btn btn-danger" data-act="del">删除</button>' +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function scopeText(scope) {
    scope = scope && typeof scope === "object" ? scope : { type: "all", ids: [] };
    if (scope.type === "dept") return "指定部门";
    if (scope.type === "role") return "指定角色";
    return "全部用户";
  }

  function initScopePills() {
    var s = window.OrgAdminStore;
    var deptWrap = $("notice-dept-wrap");
    var roleWrap = $("notice-role-wrap");
    if (deptWrap && s && Array.isArray(s.depts)) {
      deptWrap.innerHTML = s.depts
        .map(function (d) {
          return (
            '<label class="notice-pill"><input type="checkbox" value="' +
            U.escapeHtml(d.id) +
            '"> ' +
            U.escapeHtml(d.name) +
            "</label>"
          );
        })
        .join("");
    }
    if (roleWrap && s && Array.isArray(s.roles)) {
      roleWrap.innerHTML = s.roles
        .map(function (r) {
          return (
            '<label class="notice-pill"><input type="checkbox" value="' +
            U.escapeHtml(r.id) +
            '"> ' +
            U.escapeHtml(r.name) +
            "</label>"
          );
        })
        .join("");
    }

    function syncScopePick() {
      var v = getScopeType();
      $("notice-scope-dept") && ($("notice-scope-dept").hidden = v !== "dept");
      $("notice-scope-role") && ($("notice-scope-role").hidden = v !== "role");
    }
    document.querySelectorAll('input[name="notice-scope"]').forEach(function (el) {
      el.addEventListener("change", syncScopePick);
    });
    syncScopePick();
  }

  function getScopeType() {
    var el = document.querySelector('input[name="notice-scope"]:checked');
    return el ? el.value : "all";
  }

  function setScope(scope) {
    scope = scope && typeof scope === "object" ? scope : { type: "all", ids: [] };
    var type = scope.type || "all";
    var r = document.querySelector('input[name="notice-scope"][value="' + type + '"]');
    if (r) r.checked = true;
    $("notice-scope-dept") && ($("notice-scope-dept").hidden = type !== "dept");
    $("notice-scope-role") && ($("notice-scope-role").hidden = type !== "role");
    var ids = Array.isArray(scope.ids) ? scope.ids : [];
    document.querySelectorAll("#notice-dept-wrap input[type=checkbox], #notice-role-wrap input[type=checkbox]").forEach(function (cb) {
      cb.checked = ids.indexOf(cb.value) >= 0;
    });
  }

  function readScope() {
    var type = getScopeType();
    var ids = [];
    if (type === "dept") {
      document.querySelectorAll("#notice-dept-wrap input[type=checkbox]:checked").forEach(function (cb) {
        ids.push(cb.value);
      });
    } else if (type === "role") {
      document.querySelectorAll("#notice-role-wrap input[type=checkbox]:checked").forEach(function (cb) {
        ids.push(cb.value);
      });
    }
    return { type: type, ids: ids };
  }

  function sanitizeHtml(html) {
    html = String(html || "");
    // 只允许很小的白名单，避免脚本注入（原型仍要安全）
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/ on\w+="[^"]*"/gi, "");
    html = html.replace(/ on\w+='[^']*'/gi, "");
    return html;
  }

  function editor() {
    return $("notice-f-editor");
  }

  function exec(cmd) {
    try {
      document.execCommand(cmd, false, null);
    } catch (e) {}
  }

  function insertImageDataUrl(dataUrl) {
    var ed = editor();
    if (!ed) return;
    ed.focus();
    var img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "公告图片";
    img.style.maxWidth = "100%";
    var sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount) {
      var r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(img);
      r.setStartAfter(img);
      r.setEndAfter(img);
      sel.removeAllRanges();
      sel.addRange(r);
    } else {
      ed.appendChild(img);
    }
    ed.appendChild(document.createElement("br"));
  }

  function openModal(isNew, notice) {
    var bd = $("notice-modal");
    if (!bd) return;
    editingId = isNew ? null : notice && notice.id;
    $("notice-modal-title").textContent = isNew ? "发布公告" : "编辑公告";
    $("notice-f-title").value = notice && !isNew ? notice.title : "";
    var ed = editor();
    if (ed) ed.innerHTML = sanitizeHtml(notice && !isNew ? notice.contentHtml || "" : "");
    $("notice-f-draft").checked = isNew ? false : notice && notice.status === "draft";
    setScope((notice && notice.scope) || { type: "all", ids: [] });
    bd.hidden = false;
    bd.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    var bd = $("notice-modal");
    if (!bd) return;
    bd.hidden = true;
    bd.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function saveModal() {
    if (!Store) return;
    var title = ($("notice-f-title").value || "").trim();
    var ed = editor();
    var contentHtml = ed ? sanitizeHtml(ed.innerHTML) : "";
    var content = (ed ? ed.textContent : "") || "";
    var draft = $("notice-f-draft") && $("notice-f-draft").checked;
    if (!title) {
      U.showToast("notice-toast", "请填写标题");
      return;
    }
    var scope = readScope();
    if ((scope.type === "dept" || scope.type === "role") && (!scope.ids || !scope.ids.length)) {
      U.showToast("notice-toast", "请选择可见范围");
      return;
    }
    if (!editingId) {
      Store.addNotice({ title: title, content: content, contentHtml: contentHtml, scope: scope, status: draft ? "draft" : "published" });
      U.showToast("notice-toast", draft ? "已保存为草稿" : "已发布");
    } else {
      Store.updateNotice(editingId, {
        title: title,
        content: content,
        contentHtml: contentHtml,
        scope: scope,
        status: draft ? "draft" : "published",
      });
      U.showToast("notice-toast", "已保存");
    }
    closeModal();
    render();
  }

  function init() {
    initScopePills();
    $("notice-btn-add") &&
      $("notice-btn-add").addEventListener("click", function () {
        openModal(true, null);
      });
    $("notice-modal-save") && $("notice-modal-save").addEventListener("click", saveModal);
    U.bindModalClose("notice-modal", closeModal);

    // editor toolbar
    document.querySelectorAll(".notice-ed-btn[data-ed]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-ed");
        if (a === "bold") exec("bold");
        else if (a === "italic") exec("italic");
        else if (a === "ul") exec("insertUnorderedList");
        else if (a === "ol") exec("insertOrderedList");
      });
    });
    $("notice-insert-img") &&
      $("notice-insert-img").addEventListener("click", function () {
        $("notice-img-file") && $("notice-img-file").click();
      });
    $("notice-img-file") &&
      $("notice-img-file").addEventListener("change", function () {
        var f = this.files && this.files[0];
        if (!f) return;
        if (!/^image\\//i.test(f.type)) {
          U.showToast("notice-toast", "请选择图片文件");
          return;
        }
        if (f.size > 2.5 * 1024 * 1024) {
          U.showToast("notice-toast", "图片过大（建议 ≤ 2.5MB）");
          return;
        }
        var rd = new FileReader();
        rd.onload = function () {
          insertImageDataUrl(String(rd.result || ""));
        };
        rd.readAsDataURL(f);
        this.value = "";
      });

    var tb = $("notice-tbody");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        var id = tr.getAttribute("data-id");
        var n = Store.getNoticesSorted().find(function (x) {
          return x.id === id;
        });
        var act = btn.getAttribute("data-act");
        if (act === "edit" && n) openModal(false, n);
        else if (act === "publish") {
          Store.updateNotice(id, { status: "published" });
          U.showToast("notice-toast", "已发布");
          render();
        } else if (act === "offline") {
          Store.updateNotice(id, { status: "draft" });
          U.showToast("notice-toast", "已下线为草稿");
          render();
        } else if (act === "del") {
          if (!window.confirm("确定删除该公告？")) return;
          Store.deleteNotice(id);
          U.showToast("notice-toast", "已删除");
          render();
        }
      });
    }

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
