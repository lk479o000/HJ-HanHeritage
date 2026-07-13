/**
 * 登录日志：搜索、删除所选、导出
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

  var filteredList = [];

  function applyFilters() {
    var kw = (($("log-in-keyword") && $("log-in-keyword").value) || "").trim().toLowerCase();
    filteredList = store().loginLogs.filter(function (row) {
      if (!kw) return true;
      return (
        String(row.account).toLowerCase().indexOf(kw) >= 0 ||
        String(row.ip).toLowerCase().indexOf(kw) >= 0 ||
        String(row.message || "").toLowerCase().indexOf(kw) >= 0
      );
    });
    filteredList.sort(function (a, b) {
      return b.at - a.at;
    });
  }

  function render() {
    applyFilters();
    var tb = $("log-in-tbody");
    var hall = $("log-in-check-all");
    if (!tb) return;
    if (!filteredList.length) {
      tb.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:var(--admin-muted);padding:20px">无匹配记录</td></tr>';
      if (hall) {
        hall.checked = false;
        hall.indeterminate = false;
      }
      return;
    }
    tb.innerHTML = filteredList
      .map(function (row) {
        var res = row.ok
          ? '<span class="tag">成功</span>'
          : '<span class="tag tag-warn">失败</span>';
        return (
          "<tr>" +
          '<td><input type="checkbox" class="log-in-row-check" value="' +
          U.escapeHtml(row.id) +
          '" /></td>' +
          "<td>" +
          U.escapeHtml(fmtAt(row.at)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.account) +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.ip) +
          "</td>" +
          "<td>" +
          res +
          "</td>" +
          "<td>" +
          U.escapeHtml(row.message || "—") +
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
      .call(document.querySelectorAll(".log-in-row-check:checked"))
      .map(function (el) {
        return el.value;
      });
  }

  function deleteSelected() {
    var ids = selectedIds();
    if (!ids.length) {
      U.showToast("log-in-toast", "请先勾选要删除的日志");
      return;
    }
    if (!window.confirm("确定删除选中的 " + ids.length + " 条登录日志？")) return;
    var set = {};
    ids.forEach(function (id) {
      set[id] = true;
    });
    var logs = store().loginLogs;
    for (var i = logs.length - 1; i >= 0; i--) {
      if (set[logs[i].id]) logs.splice(i, 1);
    }
    U.showToast("log-in-toast", "已删除");
    render();
  }

  function exportCsv() {
    applyFilters();
    var rows = filteredList.map(function (row) {
      return [fmtAt(row.at), row.account, row.ip, row.ok ? "成功" : "失败", row.message || ""];
    });
    U.downloadCsv("登录日志_" + fmtAt(Date.now()).replace(/[:\s]/g, "-") + ".csv", ["时间", "账号", "IP", "结果", "说明"], rows);
    U.showToast("log-in-toast", "已导出 " + rows.length + " 条（当前筛选结果）");
  }

  function init() {
    $("log-in-search") &&
      $("log-in-search").addEventListener("click", function () {
        render();
      });
    $("log-in-reset") &&
      $("log-in-reset").addEventListener("click", function () {
        var k = $("log-in-keyword");
        if (k) k.value = "";
        render();
      });
    $("log-in-export") && $("log-in-export").addEventListener("click", exportCsv);
    $("log-in-del") && $("log-in-del").addEventListener("click", deleteSelected);

    var hall = $("log-in-check-all");
    if (hall) {
      hall.addEventListener("change", function () {
        var on = hall.checked;
        document.querySelectorAll(".log-in-row-check").forEach(function (c) {
          c.checked = on;
        });
      });
    }

    var tb = $("log-in-tbody");
    if (tb) {
      tb.addEventListener("change", function () {
        if (!hall) return;
        var boxes = tb.querySelectorAll(".log-in-row-check");
        var n = boxes.length;
        var c = 0;
        boxes.forEach(function (b) {
          if (b.checked) c++;
        });
        hall.checked = n > 0 && c === n;
        hall.indeterminate = c > 0 && c < n;
      });
    }

    var kw = $("log-in-keyword");
    if (kw) {
      kw.addEventListener("keydown", function (e) {
        if (e.key === "Enter") render();
      });
    }

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
