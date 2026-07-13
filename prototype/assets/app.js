/**
 * 页面交互脚本（Tab、全屏、取色、弹层）
 * 无构建步骤，原生 JS
 */
(function () {
  "use strict";

  function initTabs(root) {
    root = root || document;
    root.querySelectorAll("[data-tabs]").forEach(function (container) {
      var tabList = null;
      for (var i = 0; i < container.children.length; i++) {
        var ch = container.children[i];
        if (ch.classList && ch.classList.contains("tabs")) {
          tabList = ch;
          break;
        }
      }
      if (!tabList) return;
      var buttons = tabList.querySelectorAll(".tab-btn");
      if (!buttons.length) return;
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-tab");
          buttons.forEach(function (b) {
            b.setAttribute("aria-selected", b === btn ? "true" : "false");
          });
          buttons.forEach(function (b) {
            var pid = b.getAttribute("data-tab");
            var panel = document.getElementById(pid);
            if (panel) panel.hidden = pid !== id;
          });
        });
      });
    });
  }

  function initFullscreen(btnId, targetId) {
    var btn = document.getElementById(btnId);
    var target = document.getElementById(targetId);
    if (!btn || !target) return;
    btn.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        target.requestFullscreen().catch(function () {
          alert("当前浏览器暂不支持全屏。");
        });
      } else {
        document.exitFullscreen();
      }
    });
    document.addEventListener("fullscreenchange", function () {
      target.classList.toggle("viewport-fullscreen", !!document.fullscreenElement);
    });
  }

  function initBackgroundColor(inputId, targetSelector) {
    var input = document.getElementById(inputId);
    var target = document.querySelector(targetSelector);
    if (!input || !target) return;
    input.addEventListener("input", function () {
      target.style.background = input.value;
    });
  }

  function openHotspotDialog(index) {
    var dlg = document.getElementById("hotspot-dialog");
    var body = document.getElementById("hotspot-dialog-body");
    if (!dlg || !body) return;
    body.textContent =
      "墓口点位 " +
      index +
      "：此处接入墓口详情、关联文物或链接全景（数据来自后台崖墓管理）。";
    if (typeof dlg.showModal === "function") dlg.showModal();
  }

  /** 旧链接 panorama.html#pano-cliff-n 已废弃：全景页仅保留博物馆，崖墓跳转专属页 */
  function redirectPanoCliffHash() {
    var hash = window.location.hash.replace(/^#/, "");
    if (!hash || hash.indexOf("pano-cliff-") !== 0) return;
    var n = hash.replace("pano-cliff-", "");
    if (!/^\d+$/.test(n)) return;
    window.location.replace("cliff-detail.html?cliff=" + n);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTabs(document);

    initFullscreen("btn-fullscreen-coffin", "coffin-viewport");
    initBackgroundColor("coffin-bg-color", "#coffin-viewport");

    document.querySelectorAll(".hotspot").forEach(function (el) {
      el.addEventListener("click", function () {
        var i = el.getAttribute("data-index");
        openHotspotDialog(i || "?");
      });
    });

    if (/\/panorama\.html/i.test(window.location.pathname) || window.location.href.indexOf("panorama.html") !== -1) {
      redirectPanoCliffHash();
    }

    var q = window.location.search.match(/[?&]coffin=(\d+)/);
    if (q) {
      var sel = document.getElementById("coffin-select");
      if (sel) {
        sel.value = q[1];
        var ev = new Event("change", { bubbles: true });
        sel.dispatchEvent(ev);
      }
    }
  });
})();
