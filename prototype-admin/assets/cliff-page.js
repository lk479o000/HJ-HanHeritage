/**
 * 崖墓管理页：列表状态、弹窗与表单联动（原型，数据驻留内存）
 */
(function () {
  "use strict";

  /** 未上传实景三维时，用于「查看实景三维模型」的离线示范 GLB（与石棺管理一致） */
  var CLIFF_DEMO_MODEL_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

  /**
   * 未上传本地全景时使用的演示片源：与游客端 `prototype/cliff-overview.html`、`panorama.html`
   * 中 DEMO_PANO 一致（Pannellum 官方 ALMA 等距柱状图，可拖拽环视）。
   */
  var CLIFF_DEMO_PANO_URL = "https://pannellum.org/images/alma.jpg";

  var pad = function (n) {
    return n < 10 ? "0" + n : String(n);
  };

  /** 管理级别（登记表图一，单选） */
  var LEVEL_OPTIONS = [
    "全国重点文物保护单位",
    "省级文物保护单位",
    "市级和县级文物保护单位",
    "尚未核定公布为文物保护单位的不可移动文物",
    "未认定",
  ];

  /** 类别（登记表图二，单选） */
  var CATEGORY_OPTIONS = ["帝王陵寝", "名人或贵族墓", "普通墓葬", "其他古墓葬"];

  /** 台账字段：名称、地址、坐标、面积、级别、年代、类别、文物构成、简介（与登记表一致）；code / town 供编号与乡镇筛选 */
  var BASE = [
    { name: "洞溪崖墓群", town: "神臂城镇" },
    { name: "黄溪侯五墙崖墓群", town: "神臂城镇" },
    { name: "芭蕉湾崖墓群", town: "大桥镇" },
    { name: "蒋湾和幸福崖墓群", town: "真龙镇、先市镇毗邻" },
    {
      name: "大耳朵崖墓群",
      town: "临港街道",
      address:
        "四川省泸州市合江县临港街道梨子湾社区一带，地处笔架山公园附近（迁建范围以实测为准）",
      lng: "105.83458",
      lat: "28.82576",
      area: "296 平方米",
      level: "全国重点文物保护单位",
      era: "东汉",
      category: "普通墓葬",
      protectionUnitName: "大耳朵崖墓群",
      composition:
        "崖墓群含 M1—M6 等墓口；葬具见画像石棺、石筑墓室及建筑构件等，各墓口形制、尺寸有异（摘录登记表）",
      intro:
        "<p>大耳朵崖墓群分布于红砂岩崖壁，为东汉时期崖洞式墓葬。2013 年公布为全国重点文物保护单位。以下数据为原型摘录自查勘登记，正式环境请以馆藏表册为准。</p>",
    },
    { name: "魏家祠崖墓群", town: "符阳街道" },
    { name: "观音岩崖墓群", town: "荔江镇" },
    { name: "渔链子崖墓群", town: "荔江镇" },
    { name: "大路边崖墓群", town: "车辋镇" },
    { name: "佛子岩崖墓群", town: "榕山镇" },
    { name: "鱼天堂崖墓群", town: "福宝镇" },
    { name: "高村崖墓群", town: "石龙镇" },
    { name: "梭滩石崖墓群", town: "先滩镇" },
  ];

  function normalizeLevel(v) {
    v = v == null ? "" : String(v).trim();
    if (!v) return "";
    return LEVEL_OPTIONS.indexOf(v) >= 0 ? v : "";
  }

  function normalizeCategory(v) {
    v = v == null ? "" : String(v).trim();
    if (CATEGORY_OPTIONS.indexOf(v) >= 0) return v;
    return "普通墓葬";
  }

  function buildRecords() {
    return BASE.map(function (row, i) {
      var addr =
        row.address ||
        "四川省泸州市合江县·" + row.town + "（示意地址，待测绘补全）";
      var lv = row.level != null ? normalizeLevel(row.level) : "";
      var cat = row.category != null ? normalizeCategory(row.category) : "普通墓葬";
      return {
        code: "CM-" + pad(i + 1),
        name: row.name,
        town: row.town,
        status: "enabled",
        address: addr,
        lng: row.lng != null ? String(row.lng) : "",
        lat: row.lat != null ? String(row.lat) : "",
        area: row.area != null ? row.area : "",
        level: lv,
        protectionUnitName: row.protectionUnitName != null ? String(row.protectionUnitName) : "",
        era: row.era != null ? row.era : "东汉",
        category: cat,
        composition: row.composition != null ? row.composition : "",
        intro: row.intro != null ? row.intro : "",
        panoramaFileName: "",
        modelFileName: "",
        _panoObjectUrl: null,
        _modelObjectUrl: null,
      };
    });
  }

  var records = buildRecords();
  var openings = [
    // 原型默认给出 6 个模拟坐标：确保“3D 模型上叠加 6 个墓口热点”可以直接看到
    { id: 1, name: "墓口 1", coord: "x:12.4 y:3.1 z:0.8" },
    { id: 2, name: "墓口 2", coord: "x:13.1 y:2.4 z:0.7" },
    { id: 3, name: "墓口 3", coord: "x:10.9 y:3.4 z:1.1" },
    { id: 4, name: "墓口 4", coord: "x:11.6 y:2.7 z:0.9" },
    { id: 5, name: "墓口 5", coord: "x:12.9 y:3.2 z:0.6" },
    { id: 6, name: "墓口 6", coord: "x:11.2 y:2.2 z:1.0" },
  ];
  var nextOpeningId = 7;
  var lastPickedCoord = null;

  // 管理端地图叠加标点：与 prototype/assets/cliff-data.js 保持一致（图幅内百分比，可按新底图再调）
  var MAP_MARKERS_13 = [
    { id: 1, left: 13, top: 21 },
    { id: 2, left: 17, top: 28 },
    { id: 3, left: 31, top: 41 },
    { id: 4, left: 35, top: 50 },
    { id: 5, left: 46, top: 33, featured: true },
    { id: 6, left: 51, top: 43 },
    { id: 7, left: 39, top: 47 },
    { id: 8, left: 41, top: 55 },
    { id: 9, left: 56, top: 51 },
    { id: 10, left: 61, top: 45 },
    { id: 11, left: 68, top: 39 },
    { id: 12, left: 75, top: 46 },
    { id: 13, left: 83, top: 57 },
  ];

  var tombModelViewerLoadedOnce = false;
  /** 编辑挂载弹窗内 Pannellum 实例，关闭弹窗时需 destroy */
  var cliffPanoViewer = null;

  var els = {};
  var modalOkHandler = null;
  /** 从「编辑挂载」打开子弹窗后，关闭子窗时若需回到编辑挂载，存记录索引 */
  var mountReopenAfterSubmodal = null;

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg) {
    var t = $("cliff-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(function () {
      t.classList.remove("is-show");
    }, 2400);
  }

  function openModal(title, bodyHtml, footerHtml, modalClass) {
    var backdrop = $("cliff-modal");
    var titleEl = $("cliff-modal-title");
    var bodyEl = $("cliff-modal-body");
    var footEl = $("cliff-modal-footer");
    var box = backdrop && backdrop.querySelector(".admin-modal");
    if (!backdrop || !titleEl || !bodyEl || !footEl) return;
    if (cliffPanoViewer || $("cliff-pano-host")) {
      destroyCliffMediaViewers();
    }
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    footEl.innerHTML = footerHtml || "";
    if (box) {
      box.className = "admin-modal" + (modalClass ? " " + modalClass : "");
    }
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = backdrop.querySelector(".admin-modal-close");
    if (closeBtn) closeBtn.focus();
  }

  function setCliffModelViewerSrc(url) {
    var apply = function () {
      var mv = $("cliff-model-viewer");
      if (!mv) return;
      if (url) mv.setAttribute("src", url);
      else mv.removeAttribute("src");
    };
    if (!window.customElements || typeof customElements.whenDefined !== "function") {
      setTimeout(apply, 200);
      return;
    }
    var t = setTimeout(apply, 8000);
    customElements.whenDefined("model-viewer").then(function () {
      clearTimeout(t);
      apply();
    });
  }

  function setCliffInfoModelViewerSrc(url) {
    var apply = function () {
      var mv = $("cliff-info-model-viewer");
      if (!mv) return;
      if (url) mv.setAttribute("src", url);
      else mv.removeAttribute("src");
    };
    if (!window.customElements || typeof customElements.whenDefined !== "function") {
      setTimeout(apply, 200);
      return;
    }
    var t = setTimeout(apply, 8000);
    customElements.whenDefined("model-viewer").then(function () {
      clearTimeout(t);
      apply();
    });
  }

  function destroyCliffMediaViewers() {
    if (cliffPanoViewer) {
      try {
        cliffPanoViewer.destroy();
      } catch (e) {}
      cliffPanoViewer = null;
    }
    var host = $("cliff-pano-host");
    if (host) {
      host.innerHTML = "";
      host.removeAttribute("data-admin-pano-url");
    }
    setCliffModelViewerSrc(null);
    setCliffInfoModelViewerSrc(null);
  }

  function refreshMountViewers(r, opts) {
    opts = opts || {};
    if (cliffPanoViewer) {
      try {
        cliffPanoViewer.destroy();
      } catch (e) {}
      cliffPanoViewer = null;
    }
    var host = $("cliff-pano-host");
    if (host) {
      host.innerHTML = "";
      host.removeAttribute("data-admin-pano-url");
      var pname = r.panoramaFileName || "";
      var imgOk = /\.(jpe?g|png|webp|gif)$/i.test(pname);

      function setPanoHint(isDemo) {
        var ph = $("cliff-info-pano-hint");
        if (!ph) return;
        ph.textContent = isDemo
          ? "正式环境由后台下发崖墓全景资源；此处为与游客端一致的等距柱状演示片源，可拖拽环视。上传本崖墓文件后将替换。"
          : "点击底部「查看全景」可重新加载。需 2:1 等距柱状 JPG/PNG/WebP。";
      }

      function tryPannellum(panoramaUrl, isDemo) {
        if (typeof pannellum === "undefined") {
          host.innerHTML =
            '<p class="admin-muted" style="padding:24px;text-align:center">全景组件未加载，请检查网络或刷新页面。</p>';
          return;
        }
        try {
          cliffPanoViewer = pannellum.viewer("cliff-pano-host", {
            type: "equirectangular",
            panorama: panoramaUrl,
            autoLoad: true,
            showControls: true,
            compass: true,
          });
          host.setAttribute("data-admin-pano-url", panoramaUrl);
          setPanoHint(isDemo);
          if (isDemo && opts.fromInfoViewPano) {
            showToast("已加载与展示端相同的等距柱状演示全景（可拖拽环视）");
          }
        } catch (e) {
          host.removeAttribute("data-admin-pano-url");
          host.innerHTML =
            '<p class="admin-muted" style="padding:24px;text-align:center">全景加载失败，请确认图片为等距柱状（2:1）格式。</p>';
        }
      }

      if (r._panoObjectUrl && imgOk) {
        tryPannellum(r._panoObjectUrl, false);
      } else if (pname && !imgOk) {
        host.innerHTML =
          '<p class="admin-muted" style="padding:24px;text-align:center">已记录「' +
          escapeHtml(pname) +
          '」。浏览器内仅支持 JPG/PNG/WebP 等距柱状全景；ZIP/视频等请解压或转码后上传单图预览。</p>';
      } else if (pname && !r._panoObjectUrl && imgOk) {
        host.innerHTML =
          '<p class="admin-muted" style="padding:24px;text-align:center">当前会话未保留文件缓存，请重新选择全景图以在本地预览。</p>';
      } else {
        tryPannellum(CLIFF_DEMO_PANO_URL, true);
      }
    }
    setCliffModelViewerSrc(null);
    var mname = r.modelFileName || "";
    if (r._modelObjectUrl && /\.(glb|gltf)$/i.test(mname)) {
      setCliffModelViewerSrc(r._modelObjectUrl);
    }
  }

  function closeModal() {
    var backdrop = $("cliff-modal");
    if (!backdrop) return;
    if (
      !backdrop.hidden &&
      ($("cliff-pano-host") || $("cliff-model-viewer") || $("cliff-info-model-viewer"))
    ) {
      destroyCliffMediaViewers();
    }
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    modalOkHandler = null;
    var box = backdrop.querySelector(".admin-modal");
    if (box) box.className = "admin-modal";
  }

  /** 点取消、遮罩、关闭：若刚从编辑挂载打开过子窗，则回到编辑挂载 */
  function dismissModal() {
    var reopen = mountReopenAfterSubmodal;
    closeModal();
    if (reopen !== null && reopen !== undefined) {
      mountReopenAfterSubmodal = null;
      openEditMountModal(reopen);
    }
  }

  function coordLine(r) {
    if (r.lng && r.lat) return String(r.lng) + ", " + String(r.lat);
    return "—";
  }

  function stripHtml(html) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    var t = d.textContent || d.innerText || "";
    return String(t).replace(/\s+/g, " ").trim();
  }

  function ellipsizeText(s, n) {
    s = String(s || "");
    if (s.length <= n) return s;
    return s.slice(0, n) + "…";
  }

  function getFilteredPairs() {
    var townSel = els.townSel;
    var codeInp = els.codeInp;
    var statusSel = els.statusSel;
    var town = townSel && townSel.value ? townSel.value : "";
    var code = codeInp && codeInp.value ? codeInp.value.trim().toUpperCase() : "";
    var status = statusSel && statusSel.value ? statusSel.value : "";
    return records
      .map(function (r, i) {
        return { r: r, i: i };
      })
      .filter(function (o) {
        if (status && o.r.status !== status) return false;
        if (town && o.r.town !== town) return false;
        if (code) {
          var hay =
            (o.r.code || "") +
            "\n" +
            (o.r.name || "") +
            "\n" +
            (o.r.address || "") +
            "\n" +
            coordLine(o.r) +
            "\n" +
            (o.r.area || "") +
            "\n" +
            (o.r.level || "") +
            "\n" +
            (o.r.protectionUnitName || "") +
            "\n" +
            (o.r.composition || "");
          if (hay.toUpperCase().indexOf(code) < 0) return false;
        }
        return true;
      });
  }

  function renderList() {
    var tbody = els.listBody;
    if (!tbody) return;
    var pairs = getFilteredPairs();
    tbody.innerHTML = "";
    pairs.forEach(function (o) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-record-index", String(o.i));
      var stOn = o.r.status !== "disabled";
      var stHtml =
        '<span class="' +
        (stOn ? "tag" : "tag tag-warn") +
        '">' +
        (stOn ? "启用" : "禁用") +
        "</span>";
      var introPlain = stripHtml(o.r.intro);
      var compFull = o.r.composition || "";
      tr.innerHTML =
        tdDivClamp(o.r.name, o.r.name, "name", false) +
        tdDivClamp(o.r.address, o.r.address, 2, true) +
        tdDivClamp(coordLine(o.r), coordLine(o.r), 1, false) +
        tdDivClamp(o.r.area, o.r.area, 1, false) +
        tdDivClamp(o.r.level, o.r.level, 1, true) +
        tdDivClamp(o.r.protectionUnitName, o.r.protectionUnitName, 1, true) +
        tdDivClamp(o.r.era, o.r.era, 1, false) +
        tdDivClamp(o.r.category, o.r.category, 1, false) +
        tdDivClamp(compFull, compFull, 2, true) +
        tdDivClamp(introPlain, introPlain, 2, true) +
        "<td>" +
        stHtml +
        '</td><td><div class="admin-table-actions">' +
        '<button type="button" class="btn btn-ghost" data-action="cliff-view">查看</button>' +
        '<button type="button" class="btn btn-ghost" data-action="cliff-edit">编辑</button>' +
        '<button type="button" class="btn btn-danger btn-ghost" data-action="cliff-del">删除</button>' +
        '<button type="button" class="btn btn-ghost" data-action="cliff-toggle">' +
        (stOn ? "禁用" : "启用") +
        "</button></div></td>";
      tbody.appendChild(tr);
    });
  }

  function renderCliffMapMarkers() {
    var host = $("cliff-admin-map-markers");
    if (!host) return;
    host.innerHTML = "";
    MAP_MARKERS_13.forEach(function (m) {
      var idx = m.id - 1;
      var r = records[idx];
      if (!r) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "cliff-admin-map-marker" + (m.featured ? " cliff-admin-map-marker--featured" : "");
      btn.style.left = String(m.left) + "%";
      btn.style.top = String(m.top) + "%";
      btn.setAttribute("aria-label", m.featured ? "大耳朵崖墓群" : r.name + "，打开信息");
      btn.dataset.cliffIndex = String(idx);
      btn.innerHTML =
        '<span class="cliff-admin-map-marker-code">' + pad(m.id) + "</span>";
      btn.addEventListener("click", function () {
        var i = parseInt(btn.dataset.cliffIndex, 10);
        if (isNaN(i)) return;
        openCliffInfoModal(i);
      });
      host.appendChild(btn);
    });
  }

  function openCliffInfoModal(index) {
    var r = records[index];
    if (!r) return;
    function row(label, text) {
      var v = text != null && String(text).trim() !== "" ? String(text) : "—";
      return (
        '<div class="cliff-info-row"><dt>' +
        escapeHtml(label) +
        "</dt><dd>" +
        escapeHtml(v) +
        "</dd></div>"
      );
    }
    var compPlain = stripHtml(r.composition || "") || "—";
    var html =
      '<div class="cliff-info-modal">' +
      '<header class="cliff-info-head">' +
      '<div class="cliff-info-code">' +
      escapeHtml(r.code) +
      "</div>" +
      '<h3 class="cliff-info-title">' +
      escapeHtml(r.name || r.code || "") +
      "</h3>" +
      "</header>" +
      '<section class="cliff-info-section">' +
      '<h4 class="cliff-info-section-h">登记信息</h4>' +
      '<dl class="cliff-info-dl">' +
      row("名称", r.name) +
      row("地址", r.address) +
      row("坐标", coordLine(r)) +
      row("面积", r.area) +
      row("级别", r.level) +
      row("文物保护单位名称", r.protectionUnitName) +
      row("年代", r.era) +
      row("类别", r.category) +
      row("状态", r.status === "disabled" ? "禁用" : "启用") +
      "</dl>" +
      "</section>" +
      '<section class="cliff-info-section">' +
      '<h4 class="cliff-info-section-h">文物构成</h4>' +
      '<div class="cliff-info-prose cliff-info-prose--plain">' +
      escapeHtml(compPlain) +
      "</div>" +
      "</section>" +
      '<section class="cliff-info-section">' +
      '<h4 class="cliff-info-section-h">简介</h4>' +
      '<div class="cliff-info-prose cliff-info-prose--html">' +
      (r.intro ? r.intro : '<p class="admin-muted" style="margin:0">—</p>') +
      "</div>" +
      "</section>" +
      '<section class="cliff-info-section cliff-info-section--media">' +
      '<h4 class="cliff-info-section-h">空中全景</h4>' +
      '<div class="admin-media-expand-shell">' +
      '<div class="cliff-pano-host cliff-pano-host--info" id="cliff-pano-host"></div>' +
      '<button type="button" class="admin-media-expand-fab" aria-label="放大查看空中全景">放大</button>' +
      "</div>" +
      '<p class="cliff-info-media-hint" id="cliff-info-pano-hint">正式环境由后台下发崖墓全景资源；点击「查看全景」加载与展示端相同的等距柱状演示片源（可拖拽环视）。</p>' +
      "</section>" +
      '<section class="cliff-info-section cliff-info-section--model" id="cliff-info-model-section" hidden>' +
      '<h4 class="cliff-info-section-h">实景三维模型</h4>' +
      '<div class="admin-media-expand-shell">' +
      '<model-viewer id="cliff-info-model-viewer" class="cliff-model-viewer cliff-model-viewer--info" camera-controls touch-action="pan-y" interaction-prompt="none" shadow-intensity="1" environment-image="neutral" alt="崖墓实景三维"></model-viewer>' +
      '<button type="button" class="admin-media-expand-fab" aria-label="放大查看实景三维模型">放大</button>' +
      "</div>" +
      '<p class="cliff-info-media-hint" id="cliff-info-model-hint">支持 GLB/GLTF，可拖拽旋转、滚轮缩放。</p>' +
      "</section>" +
      "</div>";

    openModal(
      "崖墓信息",
      html,
      '<button type="button" class="btn" data-modal-cancel>关闭</button>' +
        '<button type="button" class="btn" id="cliff-info-view-model">查看实景三维模型</button>' +
        '<button type="button" class="btn btn-primary" id="cliff-info-view-pano">查看全景</button>' +
        '<button type="button" class="btn" id="cliff-info-edit">编辑</button>',
      "admin-modal--cliff-info"
    );

    var viewBtn = $("cliff-info-view-pano");
    if (viewBtn) {
      viewBtn.addEventListener("click", function () {
        refreshMountViewers(r, { fromInfoViewPano: true });
      });
    }
    var modelBtn = $("cliff-info-view-model");
    if (modelBtn) {
      modelBtn.addEventListener("click", function () {
        var mname = r.modelFileName || "";
        var url = r._modelObjectUrl || "";
        var extOk = /\.(glb|gltf)$/i.test(mname);
        var useDemo = !url || !extOk;
        var src = useDemo ? CLIFF_DEMO_MODEL_GLB : url;
        var sec = $("cliff-info-model-section");
        if (sec) sec.hidden = false;
        setCliffInfoModelViewerSrc(src);
        var mh = $("cliff-info-model-hint");
        if (mh) {
          mh.textContent = useDemo
            ? "当前为示范三维模型（用于演示旋转、缩放）；在「编辑」中上传 GLB/GLTF 后将显示本崖墓实景三维。"
            : "已加载本崖墓关联模型。支持 GLB/GLTF，可拖拽旋转、滚轮缩放。";
        }
        if (useDemo) {
          showToast("未上传本地模型，已加载示范三维用于预览");
        }
        if (sec) {
          try {
            sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch (e) {}
        }
      });
    }
    var editBtn = $("cliff-info-edit");
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        closeModal();
        openEditMountModal(index);
      });
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /** 列表单元格：单行/两行截断 + title 全文，行高与 admin-table--cliff 一致 */
  function tdDivClamp(display, fullTip, mode, wide) {
    var raw = display != null ? String(display).trim() : "";
    var d = raw !== "" ? raw : "—";
    var tipRaw = fullTip != null ? String(fullTip).trim() : "";
    var tip = (tipRaw !== "" ? tipRaw : raw).replace(/\s+/g, " ");
    if (!tip && d !== "—") tip = d;
    var cls = "admin-cell-clamp";
    if (mode === 2) cls += " admin-cell-clamp--2";
    else if (mode === "name") cls += " admin-cell-clamp--name";
    if (wide) cls += " admin-cell-clamp--wide";
    return (
      "<td><div class=\"" +
      cls +
      "\" title=\"" +
      escapeHtml(tip) +
      "\">" +
      escapeHtml(d) +
      "</div></td>"
    );
  }

  function buildLevelSelect(id, current) {
    var parts = [
      '<select class="admin-select" id="' +
        id +
        '"><option value="">' +
        "请选择</option>",
    ];
    LEVEL_OPTIONS.forEach(function (opt) {
      parts.push(
        '<option value="' +
          escapeHtml(opt) +
          '"' +
          (opt === current ? " selected" : "") +
          ">" +
          escapeHtml(opt) +
          "</option>"
      );
    });
    parts.push("</select>");
    return parts.join("");
  }

  function buildCategorySelect(id, current) {
    var parts = ['<select class="admin-select" id="' + id + '">'];
    CATEGORY_OPTIONS.forEach(function (opt) {
      parts.push(
        '<option value="' +
          escapeHtml(opt) +
          '"' +
          (opt === current ? " selected" : "") +
          ">" +
          escapeHtml(opt) +
          "</option>"
      );
    });
    parts.push("</select>");
    return parts.join("");
  }

  /** 县域示意范围（原型地图选点用，非测绘成果） */
  var MAP_BOUNDS = { lngMin: 105.48, lngMax: 106.28, latMin: 28.48, latMax: 28.98 };

  function lngLatToMarkerPct(lng, lat) {
    var b = MAP_BOUNDS;
    var nx = (lng - b.lngMin) / (b.lngMax - b.lngMin);
    var ny = (b.latMax - lat) / (b.latMax - b.latMin);
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return { leftPct: nx * 100, topPct: ny * 100 };
  }

  function wireMountMapPick() {
    var wrap = $("m-mount-map-pick");
    var img = $("m-mount-map-img");
    var marker = $("m-mount-map-marker");
    var lngIn = $("m-mount-lng");
    var latIn = $("m-mount-lat");
    if (!wrap || !img || !marker || !lngIn || !latIn) return;
    wrap.addEventListener("click", function (e) {
      var rect = img.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      var nx = (e.clientX - rect.left) / rect.width;
      var ny = (e.clientY - rect.top) / rect.height;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
      var b = MAP_BOUNDS;
      var lng = b.lngMin + nx * (b.lngMax - b.lngMin);
      var lat = b.latMax - ny * (b.latMax - b.latMin);
      lngIn.value = lng.toFixed(5);
      latIn.value = lat.toFixed(5);
      marker.style.left = nx * 100 + "%";
      marker.style.top = ny * 100 + "%";
      marker.hidden = false;
      showToast("已从地图点击写入经纬度（示意）");
    });
  }

  function positionMountMarkerFromInputs() {
    var lngIn = $("m-mount-lng");
    var latIn = $("m-mount-lat");
    var marker = $("m-mount-map-marker");
    if (!lngIn || !latIn || !marker) return;
    var lng = parseFloat(lngIn.value, 10);
    var lat = parseFloat(latIn.value, 10);
    if (isNaN(lng) || isNaN(lat)) {
      marker.hidden = true;
      return;
    }
    var p = lngLatToMarkerPct(lng, lat);
    if (!p) {
      marker.hidden = true;
      return;
    }
    marker.style.left = p.leftPct + "%";
    marker.style.top = p.topPct + "%";
    marker.hidden = false;
  }

  function wireRichtextToolbar(root) {
    if (!root) return;
    root.querySelectorAll("[data-rich-cmd]").forEach(function (btn) {
      btn.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      btn.addEventListener("click", function () {
        var ed = $("m-mount-intro");
        if (ed) ed.focus();
        var cmd = btn.getAttribute("data-rich-cmd");
        var val = btn.getAttribute("data-rich-val");
        if (cmd === "formatBlock" && val) {
          document.execCommand("formatBlock", false, val);
        } else if (cmd) {
          document.execCommand(cmd, false, null);
        }
      });
    });
  }

  function renderOpenings() {
    var tb = $("tomb-opening-body");
    if (!tb) return;
    tb.innerHTML = "";
    openings.forEach(function (o, idx) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        (idx + 1) +
        "</td><td>" +
        escapeHtml(o.name) +
        "</td><td>" +
        escapeHtml(o.coord) +
        '</td><td><button type="button" class="btn btn-ghost" data-o-edit="' +
        o.id +
        '">编辑</button> <button type="button" class="btn btn-danger" data-o-del="' +
        o.id +
        '">删除</button></td>';
      tb.appendChild(tr);
    });

    // 打开/编辑墓口后同步刷新 3D 热点
    renderTombHotspots();
  }

  function parseXYZCoord(coord) {
    if (!coord) return null;
    var s = String(coord).trim();
    if (!s || s === "—") return null;
    var m = s.match(/x\s*:\s*([\-0-9.]+)\s*y\s*:\s*([\-0-9.]+)\s*z\s*:\s*([\-0-9.]+)/i);
    if (!m) return null;
    return { x: m[1], y: m[2], z: m[3] };
  }

  function setTombModelViewerSrc(url) {
    var mv = $("tomb-model-viewer");
    if (!mv) return;
    if (url) mv.setAttribute("src", url);
    else mv.removeAttribute("src");
  }

  function renderTombModelAndHotspots() {
    var tip = $("tomb-3d-tip");
    var mv = $("tomb-model-viewer");
    if (!tip || !mv) return;

    // 找到“大耳朵崖墓群”台账（原型：CM-05）
    var bigEarIndex = -1;
    for (var i = 0; i < records.length; i++) {
      if (records[i] && records[i].code === "CM-05") {
        bigEarIndex = i;
        break;
      }
    }
    if (bigEarIndex < 0) {
      tip.textContent = "未找到“大耳朵崖墓群”台账（CM-05）";
      setTombModelViewerSrc(null);
      return;
    }

    var r = records[bigEarIndex];
    var url = r && r._modelObjectUrl ? r._modelObjectUrl : null;
    if (!url) {
      tip.textContent = "请先在「大耳朵崖墓群」编辑里上传无人机实景三维（GLB/GLTF），然后返回本页即可看到 6 个墓口热点。";
      setTombModelViewerSrc(null);
      return;
    }

    tip.textContent = "";
    setTombModelViewerSrc(url);
    // 模型加载完成后再叠加热点，避免部分浏览器在未加载阶段计算不了位姿
    if (!tombModelViewerLoadedOnce) {
      mv.addEventListener("load", function () {
        tombModelViewerLoadedOnce = true;
        renderTombHotspots();
      });
    } else {
      renderTombHotspots();
    }
  }

  function renderTombHotspots() {
    var mv = $("tomb-model-viewer");
    if (!mv) return;

    // 清空既有热点
    Array.prototype.slice.call(mv.querySelectorAll(".tomb-hotspot")).forEach(function (el) {
      try {
        el.remove();
      } catch (e) {}
    });

    openings.forEach(function (o) {
      var p = parseXYZCoord(o.coord);
      if (!p) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot tomb-hotspot";
      btn.slot = "hotspot-" + o.id;
      btn.dataset.openingId = String(o.id);
      btn.setAttribute("data-position", p.x + " " + p.y + " " + p.z);
      btn.setAttribute("data-normal", "0 1 0");
      btn.title = o.name;
      btn.innerHTML = '<span class="tomb-hotspot-label">' + String(o.id) + "</span>";

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openOpeningModal(parseInt(btn.dataset.openingId, 10));
      });

      mv.appendChild(btn);
    });
  }

  function exportCsv() {
    var pairs = getFilteredPairs();
    var lines = [
      "编号,名称,地址,坐标,面积,级别,文物保护单位名称,年代,类别,文物构成,简介,状态,所属乡镇",
    ];
    pairs.forEach(function (o) {
      var st = o.r.status === "disabled" ? "禁用" : "启用";
      var row = [
        o.r.code,
        o.r.name,
        o.r.address || "",
        coordLine(o.r),
        o.r.area || "",
        o.r.level || "",
        o.r.protectionUnitName || "",
        o.r.era || "",
        o.r.category || "",
        o.r.composition || "",
        stripHtml(o.r.intro),
        st,
        o.r.town || "",
      ].map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      });
      lines.push(row.join(","));
    });
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "合江崖墓群导出_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("已导出 CSV（" + pairs.length + " 条）");
  }

  function openEditMountModal(index) {
    mountReopenAfterSubmodal = null;
    var r = records[index];
    if (!r) return;
    if (!r.status) r.status = "enabled";
    var panoName = r.panoramaFileName || "未上传";
    var modelName = r.modelFileName || "未上传";
    var selEn = r.status !== "disabled" ? " selected" : "";
    var selDis = r.status === "disabled" ? " selected" : "";
    var html =
      '<p class="admin-hint" style="margin-top:0">编辑 <strong>' +
      escapeHtml(r.code) +
      "</strong> — 登记表字段与全景、三维挂载。</p>" +
      '<div class="admin-form-row"><label>名称</label><input class="admin-input" id="m-mount-name" type="text" value="' +
      escapeHtml(r.name) +
      '" /></div>' +
      '<div class="admin-form-row"><label>状态</label><select class="admin-select" id="m-mount-status">' +
      '<option value="enabled"' +
      selEn +
      ">启用</option><option value=\"disabled\"" +
      selDis +
      '>禁用</option></select></div>' +
      '<div class="admin-form-row"><label>地址</label><input class="admin-input" id="m-mount-address" type="text" value="' +
      escapeHtml(r.address) +
      '" placeholder="地址或位置（单位：以登记表为准）" /></div>' +
      '<div class="admin-form-row"><label>坐标</label><div>' +
      '<p class="admin-muted" style="margin:0 0 8px;font-size:0.82rem">在分布图上点击选点，自动填入经纬度（WGS-84 示意范围）；亦可仅手填下方经、纬度。</p>' +
      '<div class="admin-map-pick" id="m-mount-map-pick" role="button" tabindex="0" aria-label="点击地图选择经纬度">' +
      '<div class="admin-media-expand-shell admin-map-pick-expand-wrap">' +
      '<img src="assets/hejiang-han-cliff-distribution.png" alt="" class="admin-map-pick-img" id="m-mount-map-img" draggable="false" />' +
      '<button type="button" class="admin-media-expand-fab" aria-label="放大查看分布图">放大</button>' +
      "</div>" +
      '<span class="admin-map-pick-marker" id="m-mount-map-marker" hidden></span></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;align-items:center">' +
      '<input class="admin-input" id="m-mount-lng" type="text" placeholder="经度" style="max-width:160px" title="地图点击或手填" value="' +
      escapeHtml(r.lng) +
      '" />' +
      '<input class="admin-input" id="m-mount-lat" type="text" placeholder="纬度" style="max-width:160px" title="地图点击或手填" value="' +
      escapeHtml(r.lat) +
      '" /></div></div></div>' +
      '<div class="admin-form-row"><label>面积</label><input class="admin-input" id="m-mount-area" type="text" value="' +
      escapeHtml(r.area) +
      '" placeholder="如 296 平方米" /></div>' +
      '<div class="admin-form-row"><label>级别</label>' +
      buildLevelSelect("m-mount-level", r.level || "") +
      "</div>" +
      '<div class="admin-form-row"><label>文物保护单位名称</label><input class="admin-input" id="m-mount-protection-name" type="text" value="' +
      escapeHtml(r.protectionUnitName || "") +
      '" placeholder="手动填写，与公布名称一致" /></div>' +
      '<div class="admin-form-row"><label>年代</label><input class="admin-input" id="m-mount-era" type="text" value="' +
      escapeHtml(r.era) +
      '" placeholder="如 东汉" /></div>' +
      '<div class="admin-form-row"><label>类别</label>' +
      buildCategorySelect("m-mount-category", r.category || "普通墓葬") +
      "</div>" +
      '<div class="admin-form-row"><label>文物构成</label><textarea class="admin-input" id="m-mount-composition" rows="3" placeholder="墓葬形制、葬具、建筑构件等">' +
      escapeHtml(r.composition) +
      "</textarea></div>" +
      '<div class="admin-form-row"><label>简介（富文本）</label><div>' +
      '<div class="admin-richtext-toolbar">' +
      '<button type="button" class="btn btn-ghost" data-rich-cmd="bold">粗体</button>' +
      '<button type="button" class="btn btn-ghost" data-rich-cmd="italic">斜体</button>' +
      '<button type="button" class="btn btn-ghost" data-rich-cmd="underline">下划线</button>' +
      '<button type="button" class="btn btn-ghost" data-rich-cmd="insertUnorderedList">无序列表</button>' +
      '<button type="button" class="btn btn-ghost" data-rich-cmd="formatBlock" data-rich-val="p">正文</button>' +
      "</div>" +
      '<div class="admin-richtext-editor" id="m-mount-intro" contenteditable="true" role="textbox" aria-multiline="true"></div>' +
      "</div></div>" +
      '<div class="admin-form-row"><label>空中全景</label><div>' +
      '<input type="file" id="m-mount-file-pano" class="admin-input" accept=".zip,.rar,.7z,image/*,video/*,.mp4,.webm" />' +
      '<p class="admin-muted" style="margin:6px 0 0;font-size:0.82rem">当前文件：<span id="m-mount-pano-name">' +
      escapeHtml(panoName) +
      "</span></p></div></div>" +
      '<div class="admin-form-row"><label>无人机实景三维</label><div>' +
      '<input type="file" id="m-mount-file-model" class="admin-input" accept=".glb,.gltf,.zip,.obj,.fbx,.dae,model/*,application/octet-stream" />' +
      '<p class="admin-muted" style="margin:6px 0 0;font-size:0.82rem">当前文件：<span id="m-mount-model-name">' +
      escapeHtml(modelName) +
      "</span></p></div></div>" +
      '<div class="cliff-media-viewers">' +
      '<div class="cliff-viewer-card">' +
      '<div class="cliff-viewer-card-title">空中全景 · 可视化浏览</div>' +
      '<div class="admin-media-expand-shell">' +
      '<div id="cliff-pano-host" class="cliff-pano-host" role="region" aria-label="全景预览"></div>' +
      '<button type="button" class="admin-media-expand-fab" aria-label="放大查看空中全景">放大</button>' +
      "</div>" +
      '<p class="admin-muted cliff-viewer-tip">拖拽环视；需 <strong>2:1 等距柱状</strong>图。ZIP/视频包请解压或转码后上传可预览格式。</p>' +
      "</div>" +
      '<div class="cliff-viewer-card">' +
      '<div class="cliff-viewer-card-title">无人机实景三维 · 可视化浏览</div>' +
      '<div class="admin-media-expand-shell">' +
      '<model-viewer id="cliff-model-viewer" class="cliff-model-viewer" camera-controls touch-action="pan-y" interaction-prompt="none" shadow-intensity="1" environment-image="neutral" alt="实景三维模型"></model-viewer>' +
      '<button type="button" class="admin-media-expand-fab" aria-label="放大查看实景三维模型">放大</button>' +
      "</div>" +
      '<p class="admin-muted cliff-viewer-tip">支持 <strong>GLB / GLTF</strong>：拖拽旋转、滚轮缩放。倾斜摄影/OSGB 等需后端转换后再上传。</p>' +
      "</div>" +
      "</div>";

    openModal(
      "编辑挂载（数据挂载）",
      html,
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-primary" data-modal-save>保存</button>',
      "admin-modal--xl"
    );

    var introEl = $("m-mount-intro");
    if (introEl) introEl.innerHTML = r.intro || "";

    var bodyRoot = $("cliff-modal-body");
    wireRichtextToolbar(bodyRoot);
    wireMountMapPick();
    positionMountMarkerFromInputs();

    var pfn = $("m-mount-pano-name");
    var mfn = $("m-mount-model-name");
    var fp = $("m-mount-file-pano");
    var fm = $("m-mount-file-model");
    if (fp) {
      fp.addEventListener("change", function () {
        var f = fp.files && fp.files[0];
        if (f) {
          if (r._panoObjectUrl) {
            URL.revokeObjectURL(r._panoObjectUrl);
            r._panoObjectUrl = null;
          }
          r._panoObjectUrl = URL.createObjectURL(f);
          r.panoramaFileName = f.name;
          if (pfn) pfn.textContent = f.name;
          refreshMountViewers(r);
        } else if (pfn) {
          pfn.textContent = panoName;
        }
      });
    }
    if (fm) {
      fm.addEventListener("change", function () {
        var f = fm.files && fm.files[0];
        if (f) {
          if (r._modelObjectUrl) {
            URL.revokeObjectURL(r._modelObjectUrl);
            r._modelObjectUrl = null;
          }
          r._modelObjectUrl = URL.createObjectURL(f);
          r.modelFileName = f.name;
          if (mfn) mfn.textContent = f.name;
          refreshMountViewers(r);
        } else if (mfn) {
          mfn.textContent = modelName;
        }
      });
    }

    setTimeout(function () {
      refreshMountViewers(r);
    }, 0);

    $("cliff-modal").querySelector("[data-modal-save]").onclick = function () {
      var nm = ($("m-mount-name") && $("m-mount-name").value.trim()) || "";
      if (nm) r.name = nm;
      r.status = ($("m-mount-status") && $("m-mount-status").value) || "enabled";
      r.address = ($("m-mount-address") && $("m-mount-address").value) || "";
      r.lng = ($("m-mount-lng") && $("m-mount-lng").value.trim()) || "";
      r.lat = ($("m-mount-lat") && $("m-mount-lat").value.trim()) || "";
      r.area = ($("m-mount-area") && $("m-mount-area").value.trim()) || "";
      r.level = normalizeLevel($("m-mount-level") && $("m-mount-level").value);
      r.protectionUnitName =
        ($("m-mount-protection-name") && $("m-mount-protection-name").value.trim()) || "";
      r.era = ($("m-mount-era") && $("m-mount-era").value.trim()) || "";
      r.category = normalizeCategory($("m-mount-category") && $("m-mount-category").value);
      r.composition = ($("m-mount-composition") && $("m-mount-composition").value.trim()) || "";
      var ie = $("m-mount-intro");
      r.intro = ie ? ie.innerHTML.trim() : "";
      if (fp && fp.files && fp.files[0]) {
        r.panoramaFileName = fp.files[0].name;
        if (!r._panoObjectUrl) r._panoObjectUrl = URL.createObjectURL(fp.files[0]);
      }
      if (fm && fm.files && fm.files[0]) {
        r.modelFileName = fm.files[0].name;
        if (!r._modelObjectUrl) r._modelObjectUrl = URL.createObjectURL(fm.files[0]);
      }
      mountReopenAfterSubmodal = null;
      renderList();
      if (r.code === "CM-05") {
        // 大耳朵上传/更新三维模型后同步刷新 3D 热点视口
        renderTombModelAndHotspots();
      }
      closeModal();
      showToast("已保存「" + r.name + "」");
    };
  }

  /** 乡镇驻地示意经纬度（原型，非测绘成果） */
  var TOWN_CENTER_LNGLAT = {
    白沙镇: { lng: "105.93", lat: "28.72" },
    望龙镇: { lng: "105.99", lat: "28.88" },
    白米镇: { lng: "105.88", lat: "28.84" },
    临港街道: { lng: "105.83", lat: "28.81" },
    符阳街道: { lng: "105.83", lat: "28.81" },
    荔江镇: { lng: "105.85", lat: "28.79" },
    神臂城镇: { lng: "105.78", lat: "28.90" },
    大桥镇: { lng: "105.72", lat: "28.68" },
    真龙镇: { lng: "105.68", lat: "28.75" },
    先市镇: { lng: "105.65", lat: "28.73" },
    法王寺镇: { lng: "105.75", lat: "28.62" },
    尧坝镇: { lng: "105.58", lat: "28.58" },
    九支镇: { lng: "105.52", lat: "28.52" },
    车辋镇: { lng: "105.95", lat: "28.55" },
    凤鸣镇: { lng: "105.90", lat: "28.58" },
    甘雨镇: { lng: "105.98", lat: "28.62" },
    榕山镇: { lng: "105.92", lat: "28.78" },
    白鹿镇: { lng: "106.05", lat: "28.65" },
    石龙镇: { lng: "106.12", lat: "28.58" },
    先锋镇: { lng: "106.08", lat: "28.52" },
    福宝镇: { lng: "106.18", lat: "28.72" },
    先滩镇: { lng: "106.25", lat: "28.68" },
  };

  var ADD_TOWN_OPTIONS =
    '<option value="">请选择乡镇（街道）</option>' +
    "<option>白沙镇</option><option>望龙镇</option><option>白米镇</option><option>临港街道</option><option>符阳街道</option><option>荔江镇</option>" +
    "<option>神臂城镇</option><option>大桥镇</option><option>真龙镇</option><option>先市镇</option><option>法王寺镇</option><option>尧坝镇</option><option>九支镇</option>" +
    "<option>车辋镇</option><option>凤鸣镇</option><option>甘雨镇</option><option>榕山镇</option><option>白鹿镇</option><option>石龙镇</option><option>先锋镇</option>" +
    "<option>福宝镇</option><option>先滩镇</option>";

  /** 按现有 CM-xx 编号取下一个可用编号（避免删改列表后序号重复） */
  function nextCliffCode() {
    var max = 0;
    records.forEach(function (r) {
      var m = (r.code || "").match(/^CM-(\d+)$/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return "CM-" + pad(max + 1);
  }

  function openAddCliffModal() {
    mountReopenAfterSubmodal = null;
    var html =
      '<p class="cliff-add-hint">带 <span style="color:var(--admin-danger,#c0392b)">*</span> 为必填。可先保存台账，再通过列表「编辑」补充全景图、三维模型与富文本简介。</p>' +
      '<div class="cliff-add-section">' +
      '<h4 class="cliff-add-section-h">基础信息</h4>' +
      '<div class="admin-form-row"><label>崖墓群名称 <span style="color:var(--admin-danger,#c0392b)">*</span></label><input class="admin-input" id="m-add-name" type="text" placeholder="与登记表一致" /></div>' +
      '<div class="admin-form-row"><label>编号</label><input class="admin-input" id="m-add-code" type="text" placeholder="留空则按现有 CM-xx 自动递增" /></div>' +
      '<div class="admin-form-row"><label>状态</label><select class="admin-select" id="m-add-status"><option value="enabled" selected>启用</option><option value="disabled">禁用</option></select></div>' +
      '<div class="admin-form-row"><label>所属乡镇 <span style="color:var(--admin-danger,#c0392b)">*</span></label><select class="admin-select" id="m-add-town">' +
      ADD_TOWN_OPTIONS +
      "</select></div>" +
      "</div>" +
      '<div class="cliff-add-section">' +
      '<h4 class="cliff-add-section-h">位置与坐标</h4>' +
      '<div class="admin-form-row"><label>位置方式</label><select class="admin-select" id="m-add-loc-mode">' +
      '<option value="manual">手动填写地址与经纬度</option>' +
      '<option value="town_center">使用所选乡镇驻地示意坐标</option>' +
      '<option value="map_pick">在县域分布图上模拟选点</option>' +
      "</select></div>" +
      '<p class="admin-hint" id="m-add-loc-hint" style="margin:-4px 0 8px">手动模式：请在下方填写；选「乡镇驻地」或「图上选点」可自动或一键填入经纬度。</p>' +
      '<div class="admin-form-row"><label>详细位置</label><input class="admin-input" id="m-add-address" type="text" placeholder="如：某村某组、临近道路地标等；选乡镇后可为空时自动带出前缀" /></div>' +
      '<div class="admin-form-row"><label>经度</label><input class="admin-input" id="m-add-lng" type="text" placeholder="WGS-84，如 105.83" /></div>' +
      '<div class="admin-form-row"><label>纬度</label><input class="admin-input" id="m-add-lat" type="text" placeholder="如 28.81" /></div>' +
      '<p style="margin:0" id="m-add-map-pick-wrap"><button type="button" class="btn btn-primary" id="m-add-map-pick-btn">模拟选点（合江县范围内示意坐标）</button>' +
      '<span class="admin-muted" style="margin-left:10px;font-size:0.82rem">正式环境可对接地图拾取</span></p>' +
      "</div>" +
      '<div class="cliff-add-section">' +
      '<h4 class="cliff-add-section-h">文物属性（登记表）</h4>' +
      '<div class="admin-form-row"><label>面积</label><input class="admin-input" id="m-add-area" type="text" placeholder="如 296 平方米（可选）" /></div>' +
      '<div class="admin-form-row"><label>级别</label>' +
      buildLevelSelect("m-add-level", "") +
      "</div>" +
      '<div class="admin-form-row"><label>文物保护单位名称</label><input class="admin-input" id="m-add-protection-name" type="text" placeholder="留空则保存为与崖墓群名称相同" /></div>' +
      '<div class="admin-form-row"><label>年代</label><input class="admin-input" id="m-add-era" type="text" value="东汉" /></div>' +
      '<div class="admin-form-row"><label>类别</label>' +
      buildCategorySelect("m-add-category", "普通墓葬") +
      "</div>" +
      '<div class="admin-form-row"><label>文物构成</label><textarea class="admin-input" id="m-add-composition" rows="2" placeholder="墓葬形制、葬具等（可选）"></textarea></div>' +
      "</div>" +
      '<div class="cliff-add-section">' +
      '<h4 class="cliff-add-section-h">简介</h4>' +
      '<div class="admin-form-row"><label>文字简介</label><textarea class="admin-input" id="m-add-intro" rows="3" placeholder="纯文本，保存为一段落；富文本请在「编辑」中维护"></textarea></div>' +
      "</div>" +
      '<div class="cliff-add-section">' +
      '<h4 class="cliff-add-section-h">媒体资源（可选）</h4>' +
      '<p class="admin-muted" style="margin:0 0 10px;font-size:0.82rem">与「编辑挂载」一致：可选本地上传；不上传也可先保存。</p>' +
      '<div class="admin-form-row"><label>空中全景图</label><input type="file" id="m-add-pano" class="admin-input" accept="image/jpeg,image/jpg,.jpg,.jpeg,image/png,.png" /></div>' +
      '<div class="admin-form-row"><label>实景三维模型</label><input type="file" id="m-add-model" class="admin-input" accept=".glb,.gltf,model/gltf-binary,model/*" /></div>' +
      "</div>";

    openModal(
      "新增崖墓群",
      html,
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-primary" data-modal-save>确定</button>',
      "admin-modal--lg cliff-add-modal"
    );

    var modeSel = $("m-add-loc-mode");
    var townSel = $("m-add-town");
    var hint = $("m-add-loc-hint");
    var mapWrap = $("m-add-map-pick-wrap");
    var lngIn = $("m-add-lng");
    var latIn = $("m-add-lat");

    function syncLocModeUi() {
      var m = modeSel && modeSel.value;
      if (!mapWrap || !hint) return;
      if (m === "map_pick") {
        mapWrap.style.display = "";
        hint.textContent = "在县域分布图上模拟选点：点击下方按钮生成合江县范围内的示意经纬度（正式环境对接地图点击拾取）。";
      } else {
        mapWrap.style.display = "none";
      }
      if (m === "town_center") {
        hint.textContent = "将使用所选乡镇的驻地示意坐标填入经纬度；变更乡镇时可重新选择本项以刷新坐标。";
      }
      if (m === "manual") {
        hint.textContent = "手动填写详细位置与经纬度；选择乡镇后若详细位置为空，将自动填入「四川省泸州市合江县·乡镇」前缀，可再补全。";
      }
    }

    function applyTownCenter() {
      var town = townSel && townSel.value;
      var o = TOWN_CENTER_LNGLAT[town];
      if (o && lngIn && latIn) {
        lngIn.value = o.lng;
        latIn.value = o.lat;
      }
    }

    function maybeFillAddressFromTown() {
      var town = townSel && townSel.value;
      var addrIn = $("m-add-address");
      if (!addrIn || !town || !modeSel || modeSel.value !== "manual") return;
      if (!addrIn.value.trim()) {
        addrIn.value = "四川省泸州市合江县·" + town;
      }
    }

    if (modeSel) {
      modeSel.addEventListener("change", function () {
        syncLocModeUi();
        if (modeSel.value === "manual") maybeFillAddressFromTown();
      });
    }
    if (townSel) {
      townSel.addEventListener("change", function () {
        if (modeSel && modeSel.value === "town_center") applyTownCenter();
        maybeFillAddressFromTown();
      });
    }
    syncLocModeUi();

    var pickBtn = $("m-add-map-pick-btn");
    if (pickBtn) {
      pickBtn.onclick = function () {
        if (lngIn && latIn) {
          lngIn.value = (105.5 + Math.random() * 0.75).toFixed(5);
          latIn.value = (28.5 + Math.random() * 0.35).toFixed(5);
        }
        showToast("已写入模拟选点坐标");
      };
    }

    $("cliff-modal").querySelector("[data-modal-save]").onclick = function () {
      var name = ($("m-add-name") && $("m-add-name").value.trim()) || "";
      var town = ($("m-add-town") && $("m-add-town").value) || "";
      var st = ($("m-add-status") && $("m-add-status").value) || "enabled";
      var mode = (modeSel && modeSel.value) || "manual";
      var address = ($("m-add-address") && $("m-add-address").value.trim()) || "";
      var lng = ($("m-add-lng") && $("m-add-lng").value.trim()) || "";
      var lat = ($("m-add-lat") && $("m-add-lat").value.trim()) || "";

      if (!name || !town) {
        showToast("请填写崖墓群名称并选择乡镇");
        return;
      }

      if (mode === "town_center") {
        applyTownCenter();
        lng = ($("m-add-lng") && $("m-add-lng").value.trim()) || "";
        lat = ($("m-add-lat") && $("m-add-lat").value.trim()) || "";
        if (!lng || !lat) {
          showToast("该乡镇暂无示意坐标，请改用手动填写或图上模拟选点");
          return;
        }
      }

      if (mode === "manual") {
        maybeFillAddressFromTown();
        address = ($("m-add-address") && $("m-add-address").value.trim()) || "";
      }

      if (mode === "manual" && !address && (!lng || !lat)) {
        showToast("手动模式下请至少填写「详细位置」，或填写完整的经度与纬度");
        return;
      }

      if (mode === "map_pick" && (!lng || !lat)) {
        showToast('请先在「模拟选点」生成经纬度，或改选其他位置方式');
        return;
      }

      var codeIn = ($("m-add-code") && $("m-add-code").value.trim()) || "";
      var code = codeIn;
      if (!code) {
        code = nextCliffCode();
      }
      if (records.some(function (x) { return x.code === code; })) {
        showToast("编号已存在，请更换");
        return;
      }

      var introRaw = ($("m-add-intro") && $("m-add-intro").value.trim()) || "";
      var introHtml = introRaw ? "<p>" + escapeHtml(introRaw) + "</p>" : "";

      var prot =
        ($("m-add-protection-name") && $("m-add-protection-name").value.trim()) || "";
      if (!prot) prot = name;

      var fp = $("m-add-pano");
      var fm = $("m-add-model");
      var panoName = "";
      var modelName = "";
      var panoUrl = null;
      var modelUrl = null;
      if (fp && fp.files && fp.files[0]) {
        panoName = fp.files[0].name;
        panoUrl = URL.createObjectURL(fp.files[0]);
      }
      if (fm && fm.files && fm.files[0]) {
        modelName = fm.files[0].name;
        modelUrl = URL.createObjectURL(fm.files[0]);
      }

      records.push({
        code: code,
        name: name,
        town: town,
        status: st,
        address: address,
        lng: lng,
        lat: lat,
        area: ($("m-add-area") && $("m-add-area").value.trim()) || "",
        level: normalizeLevel($("m-add-level") && $("m-add-level").value),
        protectionUnitName: prot,
        era: ($("m-add-era") && $("m-add-era").value.trim()) || "东汉",
        category: normalizeCategory($("m-add-category") && $("m-add-category").value),
        composition: ($("m-add-composition") && $("m-add-composition").value.trim()) || "",
        intro: introHtml,
        panoramaFileName: panoName,
        modelFileName: modelName,
        _panoObjectUrl: panoUrl,
        _modelObjectUrl: modelUrl,
      });
      renderList();
      closeModal();
      showToast("已新增「" + name + "」");
    };
  }

  function openDeleteCliffConfirm(index) {
    mountReopenAfterSubmodal = null;
    var r = records[index];
    if (!r) return;
    openModal(
      "删除崖墓群",
      "<p>确定删除 <strong>" + escapeHtml(r.code) + " " + escapeHtml(r.name) + "</strong> 吗？原型中仅从当前页内存移除，正式环境需权限与关联校验。</p>",
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-danger" data-modal-del>删除</button>'
    );
    $("cliff-modal").querySelector("[data-modal-del]").onclick = function () {
      records.splice(index, 1);
      renderList();
      closeModal();
      showToast("已删除该崖墓群");
    };
  }

  function openPickCoordModal() {
    mountReopenAfterSubmodal = null;
    var html =
      '<p class="admin-hint" style="margin-top:0">正式环境在三维预览中点击墓口位置拾取坐标。原型下可生成<strong>模拟模型坐标</strong>，确定后写入剪贴，打开「新增墓口」时自动填入。</p>' +
      '<div class="admin-form-row"><label>X</label><input class="admin-input" id="m-pick-x" type="text" readonly /></div>' +
      '<div class="admin-form-row"><label>Y</label><input class="admin-input" id="m-pick-y" type="text" readonly /></div>' +
      '<div class="admin-form-row"><label>Z</label><input class="admin-input" id="m-pick-z" type="text" readonly /></div>' +
      '<p style="margin:12px 0 0"><button type="button" class="btn btn-primary" id="m-pick-mock">生成模拟坐标</button></p>';

    openModal(
      "在模型上拾取坐标",
      html,
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-primary" id="m-pick-confirm" disabled>确定写入</button>'
    );

    $("m-pick-mock").onclick = function () {
      var x = (10 + Math.random() * 4).toFixed(2);
      var y = (2 + Math.random() * 3).toFixed(2);
      var z = (Math.random() * 1.5).toFixed(2);
      $("m-pick-x").value = x;
      $("m-pick-y").value = y;
      $("m-pick-z").value = z;
      $("m-pick-confirm").disabled = false;
    };

    $("m-pick-confirm").onclick = function () {
      lastPickedCoord =
        "x:" + $("m-pick-x").value + " y:" + $("m-pick-y").value + " z:" + $("m-pick-z").value;
      closeModal();
      showToast("已拾取坐标，新增墓口时将自动填入");
    };
  }

  function openOpeningModal(editId) {
    mountReopenAfterSubmodal = null;
    var existing = editId ? openings.filter(function (o) { return o.id === editId; })[0] : null;
    var isEdit = !!existing;
    var defName = existing ? existing.name : "";
    var defCoord = existing ? existing.coord : lastPickedCoord || "";

    var html =
      '<div class="admin-form-row"><label>墓口名称</label><input class="admin-input" id="m-op-name" type="text" value="' +
      escapeHtml(defName) +
      '" placeholder="如 墓口 A" /></div>' +
      '<div class="admin-form-row"><label>模型内坐标</label><input class="admin-input" id="m-op-coord" type="text" value="' +
      escapeHtml(defCoord === "—" ? "" : defCoord) +
      '" placeholder="x:0 y:0 z:0" /></div>';

    openModal(
      isEdit ? "编辑墓口" : "新增墓口",
      html,
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-primary" data-modal-save>保存</button>'
    );

    $("cliff-modal").querySelector("[data-modal-save]").onclick = function () {
      var name = ($("m-op-name") && $("m-op-name").value.trim()) || "";
      var coord = ($("m-op-coord") && $("m-op-coord").value.trim()) || "—";
      if (!name) {
        showToast("请填写墓口名称");
        return;
      }
      if (isEdit) {
        existing.name = name;
        existing.coord = coord;
        showToast("已更新墓口");
      } else {
        if (openings.length >= 6) {
          showToast("大耳朵崖墓群最多维护 6 个墓口");
          return;
        }
        openings.push({ id: nextOpeningId++, name: name, coord: coord });
        lastPickedCoord = null;
        showToast("已新增墓口");
      }
      renderOpenings();
      closeModal();
    };
  }

  function openDeleteOpeningConfirm(id) {
    mountReopenAfterSubmodal = null;
    var o = openings.filter(function (x) { return x.id === id; })[0];
    if (!o) return;
    openModal(
      "删除墓口",
      "<p>确定删除 <strong>" + escapeHtml(o.name) + "</strong> 吗？此操作在原型中仅影响当前页内存数据。</p>",
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-danger" data-modal-del>删除</button>'
    );
    $("cliff-modal").querySelector("[data-modal-del]").onclick = function () {
      openings = openings.filter(function (x) { return x.id !== id; });
      renderOpenings();
      closeModal();
      showToast("已删除");
    };
  }

  function bind() {
    els.listBody = $("cliff-list-body");
    els.townSel = $("cliff-filter-town");
    els.codeInp = $("cliff-filter-code");
    els.statusSel = $("cliff-filter-status");

    if ($("btn-cliff-search")) {
      $("btn-cliff-search").addEventListener("click", function () {
        renderList();
        var n = getFilteredPairs().length;
        showToast("查询完成，共 " + n + " 条");
      });
    }
    if ($("btn-cliff-add")) {
      $("btn-cliff-add").addEventListener("click", openAddCliffModal);
    }
    if ($("btn-cliff-export")) {
      $("btn-cliff-export").addEventListener("click", exportCsv);
    }

    var listPanel = $("cliff-list-panel");
    var listToggle = $("btn-cliff-list-toggle");
    var COLLAPSE_KEY = "admin-cliff-list-collapsed";
    function applyCliffListCollapsed(collapsed) {
      if (listPanel) listPanel.classList.toggle("is-collapsed", collapsed);
      if (listToggle) {
        listToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
        var lab = listToggle.querySelector(".cliff-list-toggle-text");
        if (lab) lab.textContent = collapsed ? "展开列表" : "收起列表";
      }
    }
    try {
      if (sessionStorage.getItem(COLLAPSE_KEY) === "1") applyCliffListCollapsed(true);
    } catch (e1) {}
    if (listToggle && listPanel) {
      listToggle.addEventListener("click", function () {
        var collapsed = !listPanel.classList.contains("is-collapsed");
        applyCliffListCollapsed(collapsed);
        try {
          sessionStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
        } catch (e2) {}
      });
    }

    if (els.listBody) {
      els.listBody.addEventListener("click", function (e) {
        var tr = e.target.closest("tr[data-record-index]");
        if (!tr) return;
        var idx = parseInt(tr.getAttribute("data-record-index"), 10);
        if (isNaN(idx)) return;
        var btn = e.target.closest("[data-action]");
        var act = btn ? btn.getAttribute("data-action") : "";
        if (act === "cliff-edit") {
          openEditMountModal(idx);
        } else if (act === "cliff-view") {
          openCliffInfoModal(idx);
        } else if (!act) {
          // 点击“崖墓索引行”也直接进入信息查看
          openCliffInfoModal(idx);
        } else if (act === "cliff-del") {
          openDeleteCliffConfirm(idx);
        } else if (act === "cliff-toggle") {
          var rec = records[idx];
          if (!rec) return;
          rec.status = rec.status === "disabled" ? "enabled" : "disabled";
          renderList();
          showToast(rec.status === "disabled" ? "已禁用" : "已启用");
        }
      });
    }

    if ($("btn-tomb-pick")) {
      $("btn-tomb-pick").addEventListener("click", openPickCoordModal);
    }
    if ($("btn-tomb-add")) {
      $("btn-tomb-add").addEventListener("click", function () {
        openOpeningModal(null);
      });
    }

    var tombBody = $("tomb-opening-body");
    if (tombBody) {
      tombBody.addEventListener("click", function (e) {
        var ed = e.target.closest("[data-o-edit]");
        var del = e.target.closest("[data-o-del]");
        if (ed) {
          openOpeningModal(parseInt(ed.getAttribute("data-o-edit"), 10));
        } else if (del) {
          openDeleteOpeningConfirm(parseInt(del.getAttribute("data-o-del"), 10));
        }
      });
    }

    var backdrop = $("cliff-modal");
    if (backdrop) {
      backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) dismissModal();
      });
      var closeBtn = backdrop.querySelector(".admin-modal-close");
      if (closeBtn) closeBtn.addEventListener("click", dismissModal);
      backdrop.addEventListener("click", function (e) {
        if (e.target.closest("[data-modal-cancel]")) dismissModal();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (window.AdminMediaExpand && window.AdminMediaExpand.isOpen()) return;
      var b = $("cliff-modal");
      if (b && !b.hidden) dismissModal();
    });
  }

  function init() {
    if (!$("cliff-list-body")) return;
    bind();
    renderList();
    renderOpenings();
    renderCliffMapMarkers();
    renderTombModelAndHotspots();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
