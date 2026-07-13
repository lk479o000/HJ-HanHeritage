/**
 * 在线用户：列表、强制下线（内存）
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

  function render() {
    var tb = $("online-tbody");
    if (!tb) return;
    var list = store().onlineUsers.slice().sort(function (a, b) {
      return b.loginAt - a.loginAt;
    });
    if (!list.length) {
      tb.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:var(--admin-muted);padding:20px">当前无在线会话</td></tr>';
      return;
    }
    tb.innerHTML = list
      .map(function (u) {
        return (
          "<tr data-id=\"" +
          U.escapeHtml(u.id) +
          "\">" +
          "<td>" +
          U.escapeHtml(u.name) +
          "</td>" +
          "<td>" +
          U.escapeHtml(u.dept || "—") +
          "</td>" +
          "<td>" +
          U.escapeHtml(fmtAt(u.loginAt)) +
          "</td>" +
          "<td>" +
          U.escapeHtml(u.ip) +
          "</td>" +
          "<td>" +
          U.escapeHtml(u.client || "—") +
          "</td>" +
          "<td>" +
          '<button type="button" class="btn btn-danger" data-act="kick">强制下线</button>' +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function kick(id) {
    var list = store().onlineUsers;
    var u = list.find(function (x) {
      return x.id === id;
    });
    if (!u) return;
    if (!window.confirm("确定将「" + u.name + "」强制下线？")) return;
    var idx = list.findIndex(function (x) {
      return x.id === id;
    });
    if (idx >= 0) list.splice(idx, 1);
    store().appendLogin({
      at: Date.now(),
      account: u.name,
      ip: u.ip,
      ok: false,
      message: "管理员强制下线",
    });
    U.showToast("online-toast", "已强制下线");
    render();
  }

  function init() {
    $("online-refresh") &&
      $("online-refresh").addEventListener("click", function () {
        render();
        U.showToast("online-toast", "列表已刷新");
      });

    var tb = $("online-tbody");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-act=\"kick\"]");
        if (!btn) return;
        var tr = btn.closest("tr[data-id]");
        if (!tr) return;
        kick(tr.getAttribute("data-id"));
      });
    }

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
