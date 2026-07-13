/**
 * 操作日志：查询、删除所选、导出、清空（扩展）
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;

  function store() {
    return window.LogMonitorStore;
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function fmtAt(ms) {
    var d = new Date(ms);
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  function startOfDay(iso) {
    if (!iso) return null;
    var p = iso.split("-");
    if (p.length < 3) return null;
    return new Date(+p[0], +p[1] - 1, +p[2], 0, 0, 0, 0).getTime();
  }

  function endOfDay(iso) {
    if (!iso) return null;
    var p = iso.split("-");
    if (p.length < 3) return null;
    return new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59, 999).getTime();
  }

  var filteredList = [];

  function applyFilters() {
    var s = startOfDay(($("log-op-start") && $("log-op-start").value) || "");
    var e = endOfDay(($("log-op-end") && $("log-op-end").value) || "");
    var kw = (($("log-op-keyword") && $("log-op-keyword").value) || "").trim().toLowerCase();

    filteredList = store().operationLogs.filter(function (row) {
      if (s != null && row.at < s) return false;
      if (e != null && row.at > e) return false;
      if (kw) {
        var blob =
          (row.userDisplay || "") +
          (row.module || "") +
          (row.action || "") +
          (row.detail || "") +
          (row.ip || "");
        if (blob.toLowerCase().indexOf(kw) < 0) return false;
      }
      return true;
    });
    filteredList.sort(function (a, b) {
      return b.at - a.at;
    });
  }

  function render() {
    applyFilters();
    var tb = $("log-op-tbody");
    var hall = $("log-op-check-all");
    if (!tb) return;
    if (!filteredList.length) {
      tb.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--admin-muted);padding:20px">无匹配记录</td></tr>';
      if (hall) {
        hall.checked = false;
        hall.indeterminate = false;
      }
      return;
    }
    tb.innerHTML = filteredList
      .map(function (row) {
        return (
          "<tr>" +
          '<td><input type="checkbox" class="log-op-row-check" value="' +
          U.escapeHtml(row.id) +
          '" /></td>' +
          "<td>" +
          U.escapeHtml(fmtAt(row.at)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.userDisplay) +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.module) +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.action) +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.detail || "—") +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.ip || "—") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    if (hall) {
      hall.checked = false;
      hall.indeterminate = false;
    }
  }

  function selectedIds() {
    return Array.prototype.slice
      .call(document.querySelectorAll(".log-op-row-check:checked"))
      .map(function (el) {
        return el.value;
      });
  }

  function deleteByIds(ids) {
    if (!ids.length) {
      U.showToast("log-op-toast", "请先勾选要删除的日志");
      return;
    }
    if (!window.confirm("确定删除选中的 " + ids.length + " 条操作日志？")) return;
    var set = {};
    ids.forEach(function (id) {
      set[id] = true;
    });
    var logs = store().operationLogs;
    for (var i = logs.length - 1; i >= 0; i--) {
      if (set[logs[i].id]) logs.splice(i, 1);
    }
    U.showToast("log-op-toast", "已删除");
    render();
  }

  function exportCsv() {
    applyFilters();
    var rows = filteredList.map(function (row) {
      return [fmtAt(row.at), row.userDisplay, row.module, row.action, row.detail || "", row.ip || ""];
    });
    U.downloadCsv(
      "操作日志_" + fmtAt(Date.now()).replace(/[:\s]/g, "-") + ".csv",
      ["时间", "用户", "模块", "操作", "详情", "终端IP"],
      rows
    );
    U.showToast("log-op-toast", "已导出 " + rows.length + " 条（当前筛选结果）");
  }

  function clearAll() {
    if (!window.confirm("确定清空全部操作日志？此操作不可恢复（原型）。")) return;
    store().operationLogs.length = 0;
    U.showToast("log-op-toast", "已清空");
    render();
  }

  function init() {
    $("log-op-search") &&
      $("log-op-search").addEventListener("click", function () {
        render();
      });
    $("log-op-export") && $("log-op-export").addEventListener("click", exportCsv);
    $("log-op-del") &&
      $("log-op-del").addEventListener("click", function () {
        deleteByIds(selectedIds());
      });
    $("log-op-clear") && $("log-op-clear").addEventListener("click", clearAll);

    var hall = $("log-op-check-all");
    if (hall) {
      hall.addEventListener("change", function () {
        var on = hall.checked;
        document.querySelectorAll(".log-op-row-check").forEach(function (c) {
          c.checked = on;
        });
      });
    }

    var tb = $("log-op-tbody");
    if (tb) {
      tb.addEventListener("change", function () {
        if (!hall) return;
        var boxes = tb.querySelectorAll(".log-op-row-check");
        var n = boxes.length;
        var c = 0;
        boxes.forEach(function (b) {
          if (b.checked) c++;
        });
        hall.checked = n > 0 && c === n;
        hall.indeterminate = c > 0 && c < n;
      });
    }

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
