/**
 * 服务监控：CPU / 内存(系统+JVM) / 服务器 / JVM 详情 / 磁盘 / 节点（演示刷新）
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

  function fmtUptimeZh(ms) {
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400);
    s %= 86400;
    var h = Math.floor(s / 3600);
    s %= 3600;
    var m = Math.floor(s / 60);
    var parts = [];
    if (d) parts.push(d + "天");
    if (h) parts.push(h + "小时");
    parts.push(m + "分钟");
    return parts.join("");
  }

  function fmtBytesGb(gb) {
    return gb.toFixed(2) + "G";
  }

  function fmtBytesMb(mb) {
    return mb.toFixed(2) + "M";
  }

  var hostBoot = Date.now() - (30 * 24 * 3600 + 22 * 3600 + 39 * 60) * 1000;

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function refresh() {
    var cores = 4;
    var userPct = clamp(rnd(0.3, 2.5), 0.1, 8);
    var sysPct = clamp(rnd(0, 1.2), 0, 5);
    var idlePct = clamp(100 - userPct - sysPct, 85, 99.9);

    setText("mon-cpu-cores", String(cores));
    setText("mon-cpu-user", userPct.toFixed(2) + "%");
    setText("mon-cpu-sys", sysPct.toFixed(2) + "%");
    setText("mon-cpu-idle", idlePct.toFixed(2) + "%");

    var sysTotalG = 7.54;
    var sysUsedG = clamp(rnd(3.2, 4.2), 2.5, 6.5);
    var sysFreeG = sysTotalG - sysUsedG;
    var sysUsePct = (sysUsedG / sysTotalG) * 100;

    var jvmMaxM = clamp(rnd(580, 680), 512, 1024);
    var jvmUsedM = clamp(rnd(100, 180), 60, jvmMaxM * 0.85);
    var jvmFreeM = jvmMaxM - jvmUsedM;
    var jvmUsePct = (jvmUsedM / jvmMaxM) * 100;

    setText("mon-mem-sys-total", fmtBytesGb(sysTotalG));
    setText("mon-mem-sys-used", fmtBytesGb(sysUsedG));
    setText("mon-mem-sys-free", fmtBytesGb(sysFreeG));
    setText("mon-mem-sys-pct", sysUsePct.toFixed(2) + "%");

    setText("mon-mem-jvm-total", jvmMaxM.toFixed(1) + "M");
    setText("mon-mem-jvm-used", jvmUsedM.toFixed(2) + "M");
    setText("mon-mem-jvm-free", jvmFreeM.toFixed(2) + "M");
    setText("mon-mem-jvm-pct", jvmUsePct.toFixed(2) + "%");

    setText("mon-srv-name", "VM-8-5-centos（演示）");
    setText("mon-srv-os", "Linux");
    setText("mon-srv-ip", "127.0.0.1");
    setText("mon-srv-arch", "amd64");

    setText("mon-jvm-name", "OpenJDK 64-Bit Server VM（演示）");
    setText("mon-jvm-ver", "17.0.9");
    setText("mon-jvm-start", "2026-03-28 08:00:00");
    var up = Date.now() - hostBoot + Math.round(rnd(-60000, 60000));
    setText("mon-jvm-uptime", fmtUptimeZh(up));
    setText("mon-jvm-home", "/usr/lib/jvm/java-17-openjdk-amd64");
    setText("mon-jvm-proj", "/opt/han-coffin/admin-api");
    setText("mon-jvm-args", "[-Xmx1024M, -Xms512M, -XX:+UseG1GC]");

    var diskSpecs = [
      { mnt: "/", totalG: 50 },
      { mnt: "/data", totalG: 200 },
    ];
    var tb = $("mon-disk-tbody");
    if (tb) {
      tb.innerHTML = diskSpecs
        .map(function (r) {
          var pct = clamp(r.mnt === "/" ? rnd(34, 42) : rnd(58, 68), 28, 88);
          var usedG = (r.totalG * pct) / 100;
          var freeG = r.totalG - usedG;
          return (
            "<tr><td>" +
            U.escapeHtml(r.mnt) +
            '</td><td class="num">' +
            U.escapeHtml(r.totalG + "G") +
            '</td><td class="num">' +
            U.escapeHtml(usedG.toFixed(1) + "G") +
            '</td><td class="num">' +
            U.escapeHtml(freeG.toFixed(1) + "G") +
            '</td><td class="num">' +
            U.escapeHtml(pct.toFixed(2) + "%") +
            "</td></tr>"
          );
        })
        .join("");
    }

    var vmRows = [
      { name: "vm-app-01（应用）", type: "虚拟机", cpu: rnd(15, 40), mem: rnd(1.8, 3.2), st: "运行中" },
      { name: "vm-db-01（数据库）", type: "虚拟机", cpu: rnd(8, 28), mem: rnd(4, 7.5), st: "运行中" },
      { name: "物理节点 nginx-01", type: "服务器", cpu: rnd(1, 6), mem: rnd(0.05, 0.12), st: "运行中" },
    ];
    var vtb = $("mon-vm-tbody");
    if (vtb) {
      vtb.innerHTML = vmRows
        .map(function (r) {
          var cpuV = r.cpu.toFixed(1) + "%";
          var memV = r.mem < 2 ? r.mem.toFixed(2) + " GB" : r.mem.toFixed(1) + " GB";
          return (
            "<tr><td>" +
            U.escapeHtml(r.name) +
            "</td><td>" +
            U.escapeHtml(r.type) +
            "</td><td><span class=\"tag mon-status-ok\">" +
            U.escapeHtml(r.st) +
            "</span></td><td class=\"num\">" +
            U.escapeHtml(cpuV) +
            "</td><td class=\"num\">" +
            U.escapeHtml(memV) +
            "</td></tr>"
          );
        })
        .join("");
    }

    var meta = $("mon-refresh-meta");
    if (meta) {
      var d = new Date();
      function p(n) {
        return n < 10 ? "0" + n : String(n);
      }
      meta.textContent =
        "上次刷新：" +
        d.getFullYear() +
        "-" +
        p(d.getMonth() + 1) +
        "-" +
        p(d.getDate()) +
        " " +
        p(d.getHours()) +
        ":" +
        p(d.getMinutes()) +
        ":" +
        p(d.getSeconds()) +
        "（演示数据）";
    }
  }

  var timer = null;

  function init() {
    refresh();
    $("mon-service-refresh") &&
      $("mon-service-refresh").addEventListener("click", function () {
        refresh();
        U.showToast("mon-jvm-toast", "已刷新");
      });

    var auto = $("mon-service-auto");
    function tickAuto() {
      if (auto && auto.checked) refresh();
    }
    if (auto) {
      auto.addEventListener("change", function () {
        if (timer) clearInterval(timer);
        timer = null;
        if (auto.checked) timer = setInterval(tickAuto, 5000);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
