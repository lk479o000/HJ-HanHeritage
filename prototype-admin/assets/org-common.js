/**
 * 组织模块共用：树序、Toast、弹窗、ID
 */
(function () {
  "use strict";
  var g = window.OrgAdminUI = window.OrgAdminUI || {};

  g.$ = function (id) {
    return document.getElementById(id);
  };

  g.escapeHtml = function (s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  };

  g.showToast = function (id, msg) {
    var t = g.$(id);
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(g.showToast._tm);
    g.showToast._tm = setTimeout(function () {
      t.classList.remove("is-show");
    }, 2600);
  };

  g.nextStoreId = function (key, prefix) {
    var st = window.OrgAdminStore;
    if (!st.counters[key]) st.counters[key] = 1;
    return prefix + st.counters[key]++;
  };

  /**
   * 按 parentId 构树后前序遍历，得到带 level 的行
   * @param {Array<{id:string,parentId:string|null,sort:number,name:string}>} items
   */
  g.treeRows = function (items) {
    var byParent = {};
    items.forEach(function (d) {
      var p = d.parentId == null || d.parentId === "" ? "" : d.parentId;
      if (!byParent[p]) byParent[p] = [];
      byParent[p].push(d);
    });
    Object.keys(byParent).forEach(function (k) {
      byParent[k].sort(function (a, b) {
        return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), "zh-CN");
      });
    });
    var out = [];
    function walk(pid, level) {
      var list = byParent[pid] || [];
      list.forEach(function (d) {
        out.push({ row: d, level: level });
        walk(d.id, level + 1);
      });
    }
    walk("", 0);
    return out;
  };

  g.bindModalClose = function (backdropId, onClose) {
    var bd = g.$(backdropId);
    if (!bd) return;
    bd.addEventListener("click", function (e) {
      if (e.target === bd) onClose();
    });
    bd.querySelectorAll("[data-org-modal-close]").forEach(function (btn) {
      btn.addEventListener("click", onClose);
    });
  };

  /** CSV 导出（UTF-8 BOM，便于 Excel 打开） */
  g.downloadCsv = function (filename, columnTitles, rows) {
    function cell(v) {
      var s = String(v == null ? "" : v).replace(/"/g, '""');
      return '"' + s + '"';
    }
    var lines = [columnTitles.map(cell).join(",")];
    rows.forEach(function (r) {
      lines.push(r.map(cell).join(","));
    });
    var bom = "\uFEFF";
    var blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 2000);
  };
})();
