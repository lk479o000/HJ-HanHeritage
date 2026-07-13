/**
 * 管理端：三维 / 全景 / 图片统一「放大查看」全屏层（与业务页 toast 联动）
 */
(function (global) {
  "use strict";

  var backdrop = null;
  var hostEl = null;
  var panoViewer = null;
  var openFlag = false;

  function notify(msg) {
    var t = document.getElementById("cliff-toast") || document.getElementById("coffin-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(notify._tm);
    notify._tm = setTimeout(function () {
      t.classList.remove("is-show");
    }, 2400);
  }

  function ensureDom() {
    if (backdrop) return;
    backdrop = document.createElement("div");
    backdrop.id = "admin-media-expand-root";
    backdrop.className = "admin-media-expand-backdrop";
    backdrop.setAttribute("hidden", "");
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.innerHTML =
      '<div class="admin-media-expand-panel" role="dialog" aria-modal="true" aria-label="放大查看">' +
      '<button type="button" class="admin-media-expand-close" aria-label="关闭">&times;</button>' +
      '<div class="admin-media-expand-host" id="admin-media-expand-host"></div>' +
      "</div>";
    document.body.appendChild(backdrop);
    hostEl = backdrop.querySelector("#admin-media-expand-host");
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });
    backdrop.querySelector(".admin-media-expand-close").addEventListener("click", close);
  }

  function clearHost() {
    if (panoViewer) {
      try {
        panoViewer.destroy();
      } catch (e) {}
      panoViewer = null;
    }
    if (hostEl) hostEl.innerHTML = "";
  }

  function close() {
    if (!backdrop || backdrop.hasAttribute("hidden")) return;
    clearHost();
    backdrop.setAttribute("hidden", "");
    backdrop.setAttribute("aria-hidden", "true");
    openFlag = false;
    document.body.style.overflow = "";
  }

  function openLayer() {
    ensureDom();
    clearHost();
    backdrop.removeAttribute("hidden");
    backdrop.setAttribute("aria-hidden", "false");
    openFlag = true;
    document.body.style.overflow = "hidden";
  }

  function openModelFromSrc(src) {
    if (!src || String(src).trim() === "") {
      notify("当前没有可放大的三维模型");
      return;
    }
    openLayer();
    hostEl.innerHTML =
      '<model-viewer class="admin-media-expand-mv" camera-controls touch-action="pan-y" interaction-prompt="none" shadow-intensity="1" environment-image="neutral" alt="三维模型"></model-viewer>';
    var mv = hostEl.querySelector("model-viewer");
    var apply = function () {
      mv.setAttribute("src", src);
    };
    if (global.customElements && typeof customElements.whenDefined === "function") {
      customElements.whenDefined("model-viewer").then(apply);
    } else {
      setTimeout(apply, 200);
    }
  }

  function openImage(url, alt) {
    if (!url || String(url).trim() === "") {
      notify("当前没有可放大的图片");
      return;
    }
    openLayer();
    var img = document.createElement("img");
    img.className = "admin-media-expand-img";
    img.src = url;
    img.alt = alt != null ? String(alt) : "";
    hostEl.appendChild(img);
  }

  function openPannellum(url) {
    if (!url || String(url).trim() === "") {
      notify("请先加载空中全景后再放大查看");
      return;
    }
    if (typeof global.pannellum === "undefined") {
      notify("全景组件未加载，无法放大查看");
      return;
    }
    openLayer();
    var div = document.createElement("div");
    div.id = "admin-media-expand-pano";
    div.className = "admin-media-expand-pano-host";
    hostEl.appendChild(div);
    try {
      panoViewer = global.pannellum.viewer("admin-media-expand-pano", {
        type: "equirectangular",
        panorama: url,
        autoLoad: true,
        showControls: true,
        compass: true,
      });
    } catch (e) {
      notify("全景放大加载失败");
      close();
    }
  }

  function handleShellExpand(shell) {
    var mv = shell.querySelector("model-viewer");
    if (mv) {
      var src = mv.getAttribute("src");
      if (src) {
        openModelFromSrc(src);
        return;
      }
    }

    var pano = shell.querySelector(".cliff-pano-host");
    if (pano) {
      var pu = pano.getAttribute("data-admin-pano-url");
      if (pu && typeof global.pannellum !== "undefined") {
        openPannellum(pu);
        return;
      }
    }

    var candidates = shell.querySelectorAll("img");
    var i;
    for (i = 0; i < candidates.length; i++) {
      var im = candidates[i];
      if (im.closest(".admin-media-expand-backdrop")) continue;
      if (im.hasAttribute("hidden") || im.hidden) continue;
      var st = global.getComputedStyle(im);
      if (st.display === "none" || st.visibility === "hidden") continue;
      var u = im.getAttribute("src");
      if (u) {
        openImage(u, im.getAttribute("alt") || "");
        return;
      }
    }

    notify("当前没有可放大的内容");
  }

  document.addEventListener(
    "click",
    function (e) {
      var fab = e.target.closest(".admin-media-expand-fab");
      if (!fab) return;
      var shell = fab.closest(".admin-media-expand-shell");
      if (!shell) return;
      e.preventDefault();
      e.stopPropagation();
      handleShellExpand(shell);
    },
    false
  );

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Escape") return;
      if (!openFlag) return;
      e.preventDefault();
      e.stopPropagation();
      close();
    },
    true
  );

  global.AdminMediaExpand = {
    close: close,
    isOpen: function () {
      return openFlag;
    },
    openModelFromSrc: openModelFromSrc,
    openImage: openImage,
    openPannellum: openPannellum,
  };
})(typeof window !== "undefined" ? window : this);
