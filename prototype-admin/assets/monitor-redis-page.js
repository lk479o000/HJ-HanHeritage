/**
 * 缓存监控（Redis）：基本信息、命令环形图、内存仪表盘（演示刷新）
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  var timer = null;

  /** 命令占比（合计约 100%，用于 conic-gradient） */
  var CMD_PALETTE = [
    { key: "ping", color: "#5470c6" },
    { key: "get", color: "#91cc75" },
    { key: "set", color: "#fac858" },
    { key: "hgetall", color: "#ee6666" },
    { key: "del", color: "#73c0de" },
    { key: "expire", color: "#3ba272" },
    { key: "auth", color: "#fc8452" },
    { key: "info", color: "#9a60b4" },
    { key: "其他", color: "#c0c4cc" },
  ];

  function buildCommandMix() {
    var raw = [
      { key: "ping", w: 38 + rnd(0, 10) },
      { key: "get", w: 14 + rnd(0, 8) },
      { key: "set", w: 10 + rnd(0, 5) },
      { key: "hgetall", w: 8 + rnd(0, 4) },
      { key: "del", w: 7 + rnd(0, 3) },
      { key: "expire", w: 6 + rnd(0, 2) },
      { key: "auth", w: 5 + rnd(0, 2) },
      { key: "info", w: 4 + rnd(0, 2) },
      { key: "其他", w: 4 + rnd(0, 3) },
    ];
    var sum = raw.reduce(function (s, x) {
      return s + x.w;
    }, 0);
    return raw.map(function (x) {
      return { key: x.key, p: (x.w / sum) * 100 };
    });
  }

  function colorForKey(key) {
    var f = CMD_PALETTE.find(function (x) {
      return x.key === key;
    });
    return f ? f.color : "#909399";
  }

  function renderDonut(mix) {
    var el = $("redis-cmd-donut");
    if (!el) return;
    var at = 0;
    var parts = [];
    mix.forEach(function (x) {
      var start = at;
      at += (x.p / 100) * 360;
      parts.push(colorForKey(x.key) + " " + start + "deg " + at + "deg");
    });
    if (at < 360) parts.push("#ebeef5 " + at + "deg 360deg");
    el.style.background = "conic-gradient(" + parts.join(", ") + ")";
  }

  function renderLegend(mix) {
    var ul = $("redis-cmd-legend");
    if (!ul) return;
    ul.innerHTML = mix
      .map(function (x) {
        return (
          "<li>" +
          '<span class="redis-legend-dot" style="background:' +
          U.escapeHtml(colorForKey(x.key)) +
          '"></span>' +
          "<span>" +
          U.escapeHtml(x.key) +
          " " +
          x.p.toFixed(1) +
          "%</span>" +
          "</li>"
        );
      })
      .join("");
  }

  /**
   * 表盘 0–scaleMax 映射为左(0)→右(max)扫过上半圆；指针默认朝上，rotate 为正顺时针（SVG）。
   */
  function setGaugeNeedle(memM, scaleMax) {
    var g = $("redis-gauge-needle");
    if (!g) return;
    var t = clamp(memM / scaleMax, 0, 1);
    var angle = 90 - t * 180;
    g.setAttribute("transform", "rotate(" + angle.toFixed(2) + ")");
  }

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function refresh() {
    var mode = "单机";
    var port = "6379";
    var clients = Math.round(rnd(1, 6));
    var days = Math.round(rnd(85, 95));
    var memM = clamp(rnd(1.5, 2.8), 0.5, 50);
    var cpuSys = rnd(1.2, 3.5).toFixed(2);
    var memCfg = "0B";
    var aof = "否";
    var rdb = "ok";
    var keys = Math.round(rnd(72, 95));
    var inK = (rnd(0.02, 0.08)).toFixed(2);
    var outK = (rnd(0.5, 1.2)).toFixed(2);

    setText("redis-ver", "7.0.5");
    setText("redis-mode", mode);
    setText("redis-port", port);
    setText("redis-clients", String(clients));
    setText("redis-uptime", String(days));
    setText("redis-mem-used", memM.toFixed(2) + "M");
    setText("redis-cpu", cpuSys);
    setText("redis-mem-cfg", memCfg);
    setText("redis-aof", aof);
    setText("redis-rdb", rdb);
    setText("redis-keys", String(keys));
    setText("redis-net", inK + "kps / " + outK + "kps");

    var mix = buildCommandMix();
    renderDonut(mix);
    renderLegend(mix);

    var gaugeScale = 1000;
    setText("redis-gauge-mem", memM.toFixed(2) + "M");
    setGaugeNeedle(memM, gaugeScale);

    var meta = $("mon-redis-meta");
    if (meta) {
      meta.textContent = "上次刷新：" + new Date().toLocaleString("zh-CN") + " · 演示数据";
    }
  }

  function init() {
    refresh();
    $("mon-redis-refresh") &&
      $("mon-redis-refresh").addEventListener("click", function () {
        refresh();
        U.showToast("mon-redis-toast", "已刷新");
      });

    var auto = $("mon-redis-auto");
    function tick() {
      if (auto && auto.checked) refresh();
    }
    if (auto) {
      auto.addEventListener("change", function () {
        if (timer) clearInterval(timer);
        timer = null;
        if (auto.checked) timer = setInterval(tick, 4000);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
