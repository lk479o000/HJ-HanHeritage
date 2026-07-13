/**
 * 首页概览：入口链接、公告栏、统计、日志与在线
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U && U.$ ? U.$ : function (id) { return document.getElementById(id); };
  var Store = window.SysConfigStore;
  var Log = window.LogMonitorStore;
  var Org = window.OrgAdminStore;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function fmtAt(ms) {
    if (!ms) return "—";
    var d = new Date(ms);
    return pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function safeHtml(html) {
    html = String(html || "");
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/ on\w+="[^"]*"/gi, "");
    html = html.replace(/ on\w+='[^']*'/gi, "");
    html = html.replace(/<(\/?)(?!p\b|br\b|strong\b|em\b|ul\b|ol\b|li\b|img\b|a\b)[^>]*>/gi, "");
    html = html.replace(/<img\b([^>]*)>/gi, function (_, attrs) {
      var m = String(attrs).match(/\bsrc\s*=\s*("([^"]+)"|'([^']+)')/i);
      var src = m ? (m[2] || m[3] || "") : "";
      var ok = /^data:image\//i.test(src) || /^https?:\/\//i.test(src);
      return ok ? '<img src="' + esc(src) + '" alt=\"\" />' : "";
    });
    html = html.replace(/<a\b([^>]*)>/gi, function (_, attrs) {
      var m = String(attrs).match(/\bhref\s*=\s*("([^"]+)"|'([^']+)')/i);
      var href = m ? (m[2] || m[3] || "") : "";
      var safeHref = /^https?:\/\//i.test(href) ? href : "#";
      return '<a href="' + esc(safeHref) + '" target="_blank" rel="noreferrer noopener">';
    });
    return html;
  }

  function scopeText(scope) {
    scope = scope && typeof scope === "object" ? scope : { type: "all", ids: [] };
    if (scope.type === "dept") return "部门可见";
    if (scope.type === "role") return "角色可见";
    return "全体可见";
  }

  function renderNotices() {
    var host = $("dash-notices");
    if (!host || !Store) return;
    var items = Store.getPublishedNotices().slice(0, 5);
    if (!items.length) {
      host.innerHTML = '<div class="dash-empty">暂无已发布公告</div>';
      return;
    }
    host.innerHTML =
      '<ul class="dash-notice-list">' +
      items
        .map(function (n) {
          var body = n.contentHtml ? safeHtml(n.contentHtml) : "<p>" + esc(n.content || "") + "</p>";
          return (
            "<li>" +
            '<div class="dash-nt-head">' +
            '<div class="dash-nt-title">' +
            esc(n.title) +
            "</div>" +
            '<div class="dash-nt-meta">' +
            esc(fmtAt(n.publishedAt)) +
            " · " +
            esc(scopeText(n.scope)) +
            "</div>" +
            "</div>" +
            '<div class="dash-nt-body">' +
            body +
            "</div>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>";
  }

  function renderStats() {
    var host = $("dash-stats");
    if (!host) return;
    var cliffs = 13;
    var coffins = 28;
    var users = Org && Array.isArray(Org.users) ? Org.users.length : 0;
    var online = Log && Array.isArray(Log.onlineUsers) ? Log.onlineUsers.length : 0;
    var op24 = Log && Array.isArray(Log.operationLogs) ? Log.operationLogs.slice(0, 999).length : 0;
    var login24 = Log && Array.isArray(Log.loginLogs) ? Log.loginLogs.slice(0, 999).length : 0;
    var published = Store && Store.getPublishedNotices ? Store.getPublishedNotices().length : 0;

    var cards = [
      { k: "崖墓群", v: cliffs, u: "处", tone: "blue" },
      { k: "石棺", v: coffins, u: "具", tone: "jade" },
      { k: "公告（已发布）", v: published, u: "条", tone: "amber" },
      { k: "用户", v: users, u: "人", tone: "slate" },
      { k: "在线用户", v: online, u: "人", tone: "green" },
      { k: "操作日志", v: op24, u: "条", tone: "slate" },
      { k: "登录日志", v: login24, u: "条", tone: "slate" },
    ];

    host.innerHTML = cards
      .map(function (c) {
        return (
          '<div class="dash-stat dash-stat--' +
          esc(c.tone || "slate") +
          '">' +
          '<div class="dash-stat-k">' +
          esc(c.k) +
          (c.hint ? '<span class="dash-stat-hint">' + esc(c.hint) + "</span>" : "") +
          "</div>" +
          '<div class="dash-stat-v">' +
          esc(c.v) +
          '<span class="dash-stat-u">' +
          esc(c.u || "") +
          "</span>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    var meta = $("dash-stat-meta");
    if (meta) meta.textContent = "更新于 " + new Date().toLocaleString("zh-CN");
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function renderResourceBars() {
    var host = $("dash-res-bars");
    var totalHost = $("dash-res-total");
    if (!host) return;

    // 说明：原型阶段资源管理未沉淀统一统计口径，先做“可替换”的轻量示意图表。
    // 后续只要把这里替换为 ResourceStore.getStats() 即可。
    var stats = [
      { k: "全景", v: 12, tone: "blue" },
      { k: "模型", v: 18, tone: "jade" },
      { k: "图片", v: 26, tone: "amber" },
      { k: "文档", v: 6, tone: "slate" },
    ];
    var total = stats.reduce(function (s, x) { return s + (x.v || 0); }, 0);
    var max = stats.reduce(function (m, x) { return Math.max(m, x.v || 0); }, 1);
    if (totalHost) totalHost.textContent = "总计 " + total + " 项";

    host.innerHTML = stats
      .map(function (x) {
        var w = Math.round((clamp(x.v || 0, 0, max) / max) * 100);
        return (
          '<div class="dash-mini-bar dash-mini-bar--' +
          esc(x.tone || "slate") +
          '">' +
          '<div class="dash-mini-bar-k">' +
          esc(x.k) +
          "</div>" +
          '<div class="dash-mini-bar-track" role="img" aria-label="' +
          esc(x.k) +
          " " +
          esc(x.v) +
          '项">' +
          '<div class="dash-mini-bar-fill" style="width:' +
          esc(w) +
          '%"></div>' +
          "</div>" +
          '<div class="dash-mini-bar-v">' +
          esc(x.v) +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildSparkPath(values, w, h, padX, padY) {
    values = Array.isArray(values) ? values : [];
    if (!values.length) return { line: "", fill: "" };
    var max = values.reduce(function (m, v) { return Math.max(m, v); }, 1);
    var min = values.reduce(function (m, v) { return Math.min(m, v); }, values[0]);
    if (max === min) max = min + 1;

    var innerW = w - padX * 2;
    var innerH = h - padY * 2;
    var step = values.length === 1 ? 0 : innerW / (values.length - 1);

    var pts = values.map(function (v, i) {
      var x = padX + i * step;
      var t = (v - min) / (max - min);
      var y = padY + (1 - t) * innerH;
      return { x: x, y: y };
    });

    var d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      d += " L " + pts[i].x.toFixed(1) + " " + pts[i].y.toFixed(1);
    }

    var fill = d + " L " + (padX + innerW).toFixed(1) + " " + (padY + innerH).toFixed(1) +
      " L " + padX.toFixed(1) + " " + (padY + innerH).toFixed(1) + " Z";
    return { line: d, fill: fill };
  }

  function renderLoginSpark() {
    var sumHost = $("dash-login-sum");
    var line = $("dash-login-spark-line");
    var fill = $("dash-login-spark-fill");
    if (!line || !fill) return;

    // 近7天示意数据：优先从登录日志推一个“近似分布”，否则退回到固定数据。
    var base = [12, 18, 16, 22, 19, 26, 24];
    var logs = Log && Array.isArray(Log.loginLogs) ? Log.loginLogs.slice(0, 500) : [];
    if (logs.length) {
      var now = Date.now();
      var dayMs = 24 * 3600 * 1000;
      var arr = [0, 0, 0, 0, 0, 0, 0];
      logs.forEach(function (r) {
        var at = r && r.at ? Number(r.at) : 0;
        if (!at) return;
        var diff = Math.floor((now - at) / dayMs);
        if (diff >= 0 && diff < 7) arr[6 - diff] += 1;
      });
      var any = arr.some(function (n) { return n > 0; });
      if (any) base = arr;
    }

    var total = base.reduce(function (s, x) { return s + x; }, 0);
    if (sumHost) sumHost.textContent = "合计 " + total + " 次";

    var p = buildSparkPath(base, 220, 56, 8, 8);
    line.setAttribute("d", p.line);
    fill.setAttribute("d", p.fill);
  }

  function renderOpAndOnline() {
    var opHost = $("dash-op-list");
    var onHost = $("dash-online-list");
    if (opHost) {
      var ops = Log && Array.isArray(Log.operationLogs) ? Log.operationLogs.slice(0, 6) : [];
      opHost.innerHTML = ops.length
        ? ops
            .map(function (r) {
              return (
                "<li>" +
                '<div class="dash-li-row">' +
                '<div class="dash-li-title">' + esc(r.module) + "</div>" +
                '<span class="dash-badge dash-badge--slate">' + esc(r.action) + "</span>" +
                "</div>" +
                '<div class="dash-li-meta">' + esc(r.userDisplay) + " · " + esc(fmtAt(r.at)) + "</div>" +
                "</li>"
              );
            })
            .join("")
        : '<li class="dash-empty">暂无操作记录</li>';
    }
    if (onHost) {
      var ons = Log && Array.isArray(Log.onlineUsers) ? Log.onlineUsers.slice(0, 6) : [];
      onHost.innerHTML = ons.length
        ? ons
            .map(function (u) {
              return (
                "<li>" +
                '<div class="dash-li-row">' +
                '<div class="dash-li-title">' + esc(u.name) + "</div>" +
                '<span class="dash-badge dash-badge--green">在线</span>' +
                "</div>" +
                '<div class="dash-li-meta">' + esc(u.dept || "—") + " · " + esc(fmtAt(u.loginAt)) + "</div>" +
                "</li>"
              );
            })
            .join("")
        : '<li class="dash-empty">暂无在线会话</li>';
    }
  }

  function initMuseumLink() {
    var a = $("dash-museum-link");
    if (!a) return;
    a.addEventListener("click", function (e) {
      if (a.getAttribute("href") === "#") {
        e.preventDefault();
        if (U && U.showToast) U.showToast("admin-toast-global", "该链接后续替换为真实地址");
      }
    });
  }

  function ensureGlobalToast() {
    if (document.getElementById("admin-toast-global")) return;
    var t = document.createElement("div");
    t.className = "admin-toast";
    t.id = "admin-toast-global";
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }

  function init() {
    ensureGlobalToast();
    initMuseumLink();
    renderNotices();
    renderStats();
    renderResourceBars();
    renderLoginSpark();
    renderOpAndOnline();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

