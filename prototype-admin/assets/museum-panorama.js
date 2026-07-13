/**
 * 博物馆全景管理页（后台）：三分组资源管理 + 预览联动
 */
(function () {
  "use strict";

  // 临时：不依赖外网资源，先用本地样式模拟全景效果
  var FORCE_MOCK_PANO = true;

  var TYPE_META = {
    air: { label: "空中", prefix: "mus_air" },
    ground: { label: "地面", prefix: "mus_gnd" },
    inner: { label: "内部", prefix: "mus_in" },
  };

  var state = {
    activeType: "air",
    activeResId: "",
    panel: null,
  };

  var resources = {
    air: [],
    ground: [],
    inner: [],
  };

  var viewer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function baseName(filename) {
    var n = String(filename || "");
    return n.replace(/\.[^.]+$/, "") || n;
  }

  function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function makeResId(type, idx) {
    return TYPE_META[type].prefix + "_" + String(idx).padStart(2, "0");
  }

  function addSeedResource(type, name, url, size, status) {
    var list = resources[type];
    var id = makeResId(type, list.length + 1);
    list.push({
      id: id,
      fileName: name,
      positionName: baseName(name),
      url: url,
      size: size || 0,
      uploadedAt: "2026-04-03",
      status: status || "已上线",
      isBlob: false,
    });
  }

  function seed() {
    addSeedResource("air", "低空中部.jpg", "https://pannellum.org/images/alma.jpg", 892000, "已上线");
    addSeedResource("ground", "馆前广场.jpg", "https://pannellum.org/images/alma.jpg", 760000, "草稿");
    addSeedResource("inner", "展厅一.jpg", "https://pannellum.org/images/alma.jpg", 830000, "草稿");
    state.activeResId = resources.air[0].id;
  }

  function getActiveList() {
    return resources[state.activeType] || [];
  }

  function getActiveResource() {
    var list = getActiveList();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === state.activeResId) return list[i];
    }
    return list[0] || null;
  }

  function destroyViewer() {
    if (viewer) {
      try {
        viewer.destroy();
      } catch (e) {}
      viewer = null;
    }
    var host = $("museum-admin-pano-host");
    if (host) host.innerHTML = "";
  }

  function showPlaceholder(msg) {
    destroyViewer();
    var ph = $("museum-pano-placeholder");
    if (ph) {
      ph.hidden = false;
      ph.textContent = msg;
    }
  }

  function hidePlaceholder() {
    var ph = $("museum-pano-placeholder");
    if (ph) ph.hidden = true;
  }

  function renderMockPano(label) {
    destroyViewer();
    var host = $("museum-admin-pano-host");
    if (!host) return;
    host.innerHTML =
      '<div style="position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#1e3a8a 0%,#38bdf8 38%,#86efac 64%,#166534 100%)">' +
      '<div style="position:absolute;left:-20%;right:-20%;top:54%;height:34%;border-radius:50%;background:radial-gradient(ellipse at center, rgba(22,101,52,0.2) 0%, rgba(20,83,45,0.55) 55%, rgba(17,24,39,0.85) 100%);transform:perspective(700px) rotateX(58deg);"></div>' +
      '<div style="position:absolute;left:6%;top:16%;font-size:1.8rem;color:rgba(255,255,255,.7)">☁</div>' +
      '<div style="position:absolute;left:28%;top:13%;font-size:1.5rem;color:rgba(255,255,255,.65)">☁</div>' +
      '<div style="position:absolute;left:62%;top:18%;font-size:1.7rem;color:rgba(255,255,255,.68)">☁</div>' +
      '<div style="position:absolute;left:74%;top:12%;font-size:1.3rem;color:rgba(255,255,255,.6)">☁</div>' +
      '<div style="position:absolute;left:14%;top:60%;width:72%;height:4px;background:rgba(255,255,255,.42);filter:blur(1px)"></div>' +
      '<div style="position:absolute;left:14%;bottom:18px;padding:6px 10px;border-radius:6px;background:rgba(15,23,42,.55);color:#e2e8f0;font-size:.82rem">模拟全景 · ' +
      esc(label || "视点") +
      "</div>" +
      "</div>";
  }

  function mountViewer(url) {
    if (FORCE_MOCK_PANO) {
      var active = getActiveResource();
      renderMockPano(active ? active.positionName : "");
      hidePlaceholder();
      return;
    }
    destroyViewer();
    var host = $("museum-admin-pano-host");
    if (!host) return;
    if (!url) {
      showPlaceholder("该分类下暂无可预览全景文件，请先在下方对应分组上传。");
      return;
    }
    if (typeof pannellum === "undefined") {
      showPlaceholder("全景组件未加载，请检查网络或刷新页面。");
      return;
    }
    try {
      viewer = pannellum.viewer("museum-admin-pano-host", {
        type: "equirectangular",
        panorama: url,
        autoLoad: true,
        showControls: true,
        compass: true,
      });
      hidePlaceholder();
    } catch (e) {
      showPlaceholder("全景加载失败，请确认上传文件为等距柱状全景图。");
    }
  }

  function applyScene() {
    var active = getActiveResource();
    state.activeResId = active ? active.id : "";
    mountViewer(active ? active.url : "");
  }

  function renderCats() {
    var root = $("museum-pano-cats");
    if (!root) return;
    root.innerHTML = "";
    ["air", "ground", "inner"].forEach(function (type) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "museum-pano-cat" + (state.activeType === type ? " is-active" : "");
      btn.setAttribute("data-cat", type);
      btn.textContent = TYPE_META[type].label + "（" + resources[type].length + "）";
      root.appendChild(btn);
    });
  }

  function renderThumbs() {
    var root = $("museum-pano-thumbs");
    if (!root) return;
    var list = getActiveList();
    root.innerHTML = "";
    if (!list.length) {
      root.innerHTML = '<span class="admin-muted" style="font-size:0.8rem;padding:4px 6px">当前分类暂无文件</span>';
      return;
    }
    list.forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "museum-pano-thumb" + (state.activeResId === r.id ? " is-selected" : "");
      b.setAttribute("data-thumb", r.id);
      b.innerHTML =
        '<span class="museum-pano-thumb-inner" aria-hidden="true"></span>' +
        '<span class="museum-pano-thumb-label">' +
        esc(r.positionName) +
        "</span>";
      root.appendChild(b);
    });
  }

  function renderRows(type) {
    var tbody = $("museum-res-active");
    if (!tbody) return;
    var list = resources[type];
    tbody.innerHTML = "";
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="admin-muted" style="text-align:center;padding:20px">暂无资源，请上传全景文件。</td></tr>';
      return;
    }
    list.forEach(function (r) {
      var tagCls = r.status === "已上线" ? "tag" : "tag tag-warn";
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        esc(r.positionName) +
        "</td>" +
        "<td>" +
        esc(r.id) +
        "</td>" +
        "<td>" +
        esc(formatSize(r.size)) +
        "</td>" +
        "<td>" +
        esc(r.uploadedAt) +
        "</td>" +
        '<td><span class="' +
        tagCls +
        '">' +
        esc(r.status) +
        "</span></td>" +
        "<td>" +
        '<button type="button" class="btn btn-ghost" data-op="preview" data-type="' +
        type +
        '" data-id="' +
        r.id +
        '">预览</button> ' +
        '<button type="button" class="btn btn-ghost" data-op="download" data-type="' +
        type +
        '" data-id="' +
        r.id +
        '">下载</button> ' +
        '<button type="button" class="btn btn-danger" data-op="delete" data-type="' +
        type +
        '" data-id="' +
        r.id +
        '">删除</button>' +
        "</td>";
      tbody.appendChild(tr);
    });
  }

  function refreshAll() {
    renderCats();
    renderThumbs();
    renderRows(state.activeType);
    updateResTabUi();
    applyScene();
  }

  function updateResTabUi() {
    var title = $("museum-res-current-title");
    if (title) title.textContent = TYPE_META[state.activeType].label + "全景";
    document.querySelectorAll(".museum-res-tab[data-res-tab]").forEach(function (btn) {
      var on = btn.getAttribute("data-res-tab") === state.activeType;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function setActiveType(type) {
    if (!resources[type]) return;
    state.activeType = type;
    state.activeResId = resources[type][0] ? resources[type][0].id : "";
    refreshAll();
  }

  function setActiveResource(type, id) {
    if (!resources[type]) return;
    state.activeType = type;
    state.activeResId = id;
    refreshAll();
    var target = $("museum-pano-viz");
    if (target) {
      try {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {}
    }
  }

  function deleteResource(type, id) {
    var list = resources[type];
    if (!list) return;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        if (list[i].isBlob && list[i].url && String(list[i].url).indexOf("blob:") === 0) {
          try {
            URL.revokeObjectURL(list[i].url);
          } catch (e) {}
        }
        list.splice(i, 1);
        break;
      }
    }
    if (state.activeType === type && state.activeResId === id) {
      state.activeResId = list[0] ? list[0].id : "";
    }
    refreshAll();
  }

  function downloadResource(type, id) {
    var list = resources[type] || [];
    var rec = list.filter(function (r) {
      return r.id === id;
    })[0];
    if (!rec || !rec.url) return;
    var a = document.createElement("a");
    a.href = rec.url;
    a.download = rec.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function uploadFiles(type, fileList) {
    if (!fileList || !fileList.length) return;
    var list = resources[type];
    var i;
    for (i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      var id = makeResId(type, list.length + 1);
      list.push({
        id: id,
        fileName: f.name,
        positionName: baseName(f.name),
        url: URL.createObjectURL(f),
        size: f.size || 0,
        uploadedAt: new Date().toISOString().slice(0, 10),
        status: "草稿",
        isBlob: true,
      });
    }
    if (state.activeType === type && !state.activeResId && list[0]) {
      state.activeResId = list[0].id;
    }
    refreshAll();
  }

  function bindPanels() {
    document.querySelectorAll("[data-museum-panel]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var key = btn.getAttribute("data-museum-panel");
        var intro = $("museum-pano-intro-panel");
        var set = $("museum-pano-settings-panel");
        if (state.panel === key) {
          state.panel = null;
          if (intro) intro.hidden = true;
          if (set) set.hidden = true;
          return;
        }
        state.panel = key;
        if (intro) intro.hidden = key !== "intro";
        if (set) set.hidden = key !== "settings";
      });
    });
  }

  function bind() {
    var cats = $("museum-pano-cats");
    var thumbs = $("museum-pano-thumbs");
    if (cats) {
      cats.addEventListener("click", function (e) {
        var b = e.target.closest(".museum-pano-cat[data-cat]");
        if (!b) return;
        setActiveType(b.getAttribute("data-cat"));
      });
    }
    if (thumbs) {
      thumbs.addEventListener("click", function (e) {
        var b = e.target.closest(".museum-pano-thumb[data-thumb]");
        if (!b) return;
        state.activeResId = b.getAttribute("data-thumb");
        refreshAll();
      });
    }

    ["air", "ground", "inner"].forEach(function (type) {
      var input = $("museum-upload-" + type);
      if (input) {
        input.addEventListener("change", function () {
          uploadFiles(type, input.files);
          input.value = "";
        });
      }
    });

    document.querySelectorAll("[data-upload-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-upload-type");
        var input = $("museum-upload-" + type);
        if (input) input.click();
      });
    });

    var uploadActiveBtn = $("museum-upload-active-btn");
    if (uploadActiveBtn) {
      uploadActiveBtn.addEventListener("click", function () {
        var input = $("museum-upload-" + state.activeType);
        if (input) input.click();
      });
    }

    document.querySelectorAll(".museum-res-tab[data-res-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveType(btn.getAttribute("data-res-tab"));
      });
    });

    var tb = $("museum-res-active");
    if (tb) {
      tb.addEventListener("click", function (e) {
        var op = e.target.closest("button[data-op]");
        if (!op) return;
        var id = op.getAttribute("data-id");
        var t = op.getAttribute("data-type");
        var action = op.getAttribute("data-op");
        if (action === "preview") setActiveResource(t, id);
        else if (action === "download") downloadResource(t, id);
        else if (action === "delete") {
          if (window.confirm("确定删除该全景资源？")) deleteResource(t, id);
        }
      });
    }

    var jump = $("museum-pano-jump-preview");
    if (jump) {
      jump.addEventListener("click", function () {
        var el = $("museum-pano-viz");
        if (el) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (err) {
            el.scrollIntoView();
          }
        }
      });
    }

    bindPanels();
  }

  function init() {
    if (!$("museum-admin-pano-host")) return;
    seed();
    bind();
    refreshAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
