/**
 * 石棺管理：登记表字段（手动录入）+ 查看 / 编辑 + 三维与四类成果图
 */
(function () {
  "use strict";

  var DEFAULT_MODEL_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

  var pad = function (n) {
    return n < 10 ? "0" + n : String(n);
  };

  function pad4(n) {
    var s = String(n);
    while (s.length < 4) s = "0" + s;
    return s;
  }

  /** 与藏品总登记台账字段一致，全部为手动录入 */
  var COFFIN_REGISTRY_FIELDS = [
    { key: "originalName", label: "原名" },
    { key: "registryType", label: "藏品总登记号（栏目标识）" },
    { key: "collectionId", label: "藏品编号" },
    { key: "code", label: "台账序号" },
    { key: "title", label: "名称" },
    { key: "tombGroup", label: "所属崖墓群" },
    { key: "eraCategory", label: "年代类型" },
    { key: "dynasty", label: "朝代" },
    { key: "eraSpecific", label: "具体年代" },
    { key: "artifactCategory", label: "文物类别" },
    { key: "textureType", label: "质地类型" },
    { key: "materialCategory", label: "质地属性" },
    { key: "materialSpecific", label: "具体质地" },
    { key: "quantity", label: "实际数量" },
    { key: "dimLength", label: "外形尺寸·长（cm）" },
    { key: "dimWidth", label: "外形尺寸·宽（cm）" },
    { key: "dimHeight", label: "外形尺寸·高（cm）" },
    { key: "dimText", label: "具体尺寸（文字）" },
    { key: "weightRange", label: "重量范围" },
    { key: "weightValue", label: "重量" },
    { key: "weightUnit", label: "重量单位" },
    { key: "relicGrade", label: "文物级别" },
    { key: "sourceType", label: "文物来源" },
    { key: "sourceDetail", label: "来源具体信息" },
    { key: "completeness", label: "完残程度" },
    { key: "completenessDetail", label: "完残状况" },
    { key: "preservationStatus", label: "保存状态" },
    { key: "accessionRange", label: "入藏时间范围" },
    { key: "accessionYear", label: "入藏年度" },
  ];

  var EDIT_SECTIONS = [
    { title: "登记与编号", keys: ["originalName", "registryType", "collectionId", "code", "title", "tombGroup"] },
    { title: "年代与类别", keys: ["eraCategory", "dynasty", "eraSpecific", "artifactCategory"] },
    { title: "质地与数量", keys: ["textureType", "materialCategory", "materialSpecific", "quantity"] },
    { title: "外形尺寸", keys: ["dimLength", "dimWidth", "dimHeight", "dimText"] },
    { title: "质量", keys: ["weightRange", "weightValue", "weightUnit"] },
    { title: "级别与来源", keys: ["relicGrade", "sourceType", "sourceDetail"] },
    { title: "完残与保存", keys: ["completeness", "completenessDetail", "preservationStatus"] },
    { title: "入藏信息", keys: ["accessionRange", "accessionYear"] },
  ];

  function getCoffinLabel(key) {
    for (var i = 0; i < COFFIN_REGISTRY_FIELDS.length; i++) {
      if (COFFIN_REGISTRY_FIELDS[i].key === key) return COFFIN_REGISTRY_FIELDS[i].label;
    }
    return key;
  }

  function createEmptyRegistryFields() {
    var o = {};
    COFFIN_REGISTRY_FIELDS.forEach(function (f) {
      o[f.key] = "";
    });
    return o;
  }

  function registryDefaultsFromSeed(i, code, title, tombGroup) {
    var o = createEmptyRegistryFields();
    o.registryType = "藏品总登记号";
    o.collectionId = pad4(i + 1);
    o.originalName = "合江东汉" + (i + 1) + "号石棺";
    o.code = code;
    o.title = title;
    o.tombGroup = tombGroup;
    o.eraCategory = "中国历史学年代";
    o.dynasty = "汉";
    o.eraSpecific = "东汉（25～220）";
    o.artifactCategory = "石器、石刻、砖瓦";
    o.textureType = "单一质地";
    o.materialCategory = "无机质";
    o.materialSpecific = "石";
    o.quantity = "1";
    o.weightUnit = "kg";
    o.sourceType = "发掘";
    return o;
  }

  var COFFIN_TITLES = [
    "1号棺（东汉羿求药图画像石棺）",
    "2号棺（东汉伏羲女娲图画像石棺）",
    "3号棺（东汉双阙迎宾画像石棺）",
    "4号棺（东汉车临天门画像石棺）",
    "5号棺（东汉车马巡行画像石棺）",
    "6号棺（东汉宴乐百戏画像石棺）",
    "7号棺（东汉神农采药画像石棺）",
    "8号棺（东汉东王公西王母画像石棺）",
    "9号棺（东汉青龙白虎画像石棺）",
    "10号棺（东汉夫妻宴享图画像石棺）",
    "11号棺（东汉庖厨酿酒画像石棺）",
    "12号棺（东汉乐舞杂技画像石棺）",
    "13号棺（东汉狩猎图画像石棺）",
    "14号棺（东汉楼阁人物画像石棺）",
    "15号棺（东汉仙境图画像石棺）",
    "16号棺（东汉四神画像石棺）",
    "17号棺（东汉门吏铺首画像石棺）",
    "18号棺（东汉瑞兽祥禽画像石棺）",
    "19号棺（东汉升仙图画像石棺）",
    "32号棺（东汉燕居画像石棺）",
    "33号棺（牛郎织女·七星北斗画像石棺）",
    "22号棺（东汉武库兵器画像石棺）",
    "23号棺（东汉求药图画像石棺）",
    "24号棺（东汉龟鹤延年画像石棺）",
    "25号棺（东汉五君子戏虎画像石棺）",
    "26号棺（东汉五君子戏虎画像石棺）",
    "27号棺（东汉西王母炼丹画像石棺）",
    "棺盖（东汉莲蓬·柿蒂纹·钱币纹棺盖）",
  ];

  var cliffs = [
    { name: "洞溪崖墓群", town: "神臂城镇" },
    { name: "黄溪侯五墙崖墓群", town: "神臂城镇" },
    { name: "芭蕉湾崖墓群", town: "大桥镇" },
    { name: "蒋湾和幸福崖墓群", town: "真龙镇、先市镇毗邻" },
    { name: "大耳朵崖墓群", town: "临港街道" },
    { name: "魏家祠崖墓群", town: "符阳街道" },
    { name: "观音岩崖墓群", town: "荔江镇" },
    { name: "渔链子崖墓群", town: "荔江镇" },
    { name: "大路边崖墓群", town: "车辋镇" },
    { name: "佛子岩崖墓群", town: "榕山镇" },
    { name: "鱼天堂崖墓群", town: "福宝镇" },
    { name: "高村崖墓群", town: "石龙镇" },
    { name: "梭滩石崖墓群", town: "先滩镇" },
  ];

  var IMG_KEYS = ["ortho", "rubbing", "line", "enhance"];
  var IMG_LABELS = {
    ortho: "数字正射图",
    rubbing: "数字拓片图",
    line: "数字线划图",
    enhance: "数字信息增强图",
  };

  var DEMO_SHORT = { ortho: "正射", rubbing: "拓片", line: "线划", enhance: "增强" };
  var DEMO_PALETTE = ["#1e40af", "#047857", "#b45309", "#a21caf", "#be123c"];

  /** 列表封面与「数字正射图」第 1 张共用：本地石棺正射示意照片（与 SVG 示意区分） */
  var DEMO_ORTHO_FIRST_PHOTO = "assets/coffin-ortho-cover-demo.png";

  /**
   * 每类 5 张离线模拟：正射图第 1 张为石棺照片，其余为 SVG（不依赖外网）。
   */
  function demoImageUrlsForSeed(recordIndex, typeKey) {
    var short = DEMO_SHORT[typeKey] || typeKey;
    var scLabel = "SC-" + pad(recordIndex + 1);
    var urls = [];
    var s;
    for (s = 0; s < 5; s++) {
      if (typeKey === "ortho" && s === 0) {
        urls.push(DEMO_ORTHO_FIRST_PHOTO);
        continue;
      }
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">' +
        '<rect fill="' +
        DEMO_PALETTE[s] +
        '" width="100%" height="100%"/>' +
        '<text x="240" y="88" text-anchor="middle" fill="rgba(255,255,255,.95)" font-size="18" font-family="Microsoft YaHei,PingFang SC,sans-serif">数字成果图 · 模拟</text>' +
        '<text x="240" y="150" text-anchor="middle" fill="#fff" font-size="30" font-weight="700" font-family="Microsoft YaHei,PingFang SC,sans-serif">' +
        short +
        " " +
        (s + 1) +
        "/5</text>" +
        '<text x="240" y="200" text-anchor="middle" fill="rgba(255,255,255,.88)" font-size="15" font-family="Microsoft YaHei,sans-serif">' +
        scLabel +
        " · " +
        IMG_LABELS[typeKey] +
        "</text>" +
        "</svg>";
      urls.push("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    }
    return urls;
  }

  function ensureImages(r) {
    if (!r._images) {
      r._images = { ortho: [], rubbing: [], line: [], enhance: [] };
    }
    IMG_KEYS.forEach(function (k) {
      if (!Array.isArray(r._images[k])) r._images[k] = [];
    });
  }

  /** 当前类型下可展示的图片列表：已上传优先，否则用示意多图 */
  function getImageList(r, key) {
    ensureImages(r);
    if (r._images[key].length) {
      return r._images[key].map(function (x) {
        return { name: x.name, url: x.url };
      });
    }
    var demos = r._demoImages && r._demoImages[key];
    if (demos && demos.length) {
      var short = DEMO_SHORT[key] || key;
      return demos.map(function (url, i) {
        var name =
          key === "ortho" && i === 0
            ? "模拟-正射图-石棺照片(1).jpg"
            : "模拟-" + short + "-" + (i + 1) + ".jpg";
        return { name: name, url: url };
      });
    }
    return [];
  }

  /**
   * 列表卡片封面：仅展示一张图，固定为「数字正射图」序列中的第 1 张（有上传用上传首图，否则用示意首图）。
   */
  function getCardCoverOrthophotoUrl(r) {
    var list = getImageList(r, "ortho");
    if (!list.length) return "";
    return list[0].url || "";
  }

  function displayId(r) {
    if (!r) return "";
    var c = r.collectionId != null ? String(r.collectionId).trim() : "";
    return c || r.code || "";
  }

  function defaultIntro(r) {
    return (
      "【" +
      displayId(r) +
      "】" +
      (r.title || "") +
      "\n\n所属崖墓群：" +
      (r.tombGroup && r.tombGroup.trim() ? r.tombGroup : "—") +
      "。\n\n合江汉代画像石棺以减地浅浮雕为主。此处为管理端预览用简介，请在「编辑」中维护或由接口下发。"
    );
  }

  function buildRecords() {
    var arr = [];
    for (var i = 0; i < 28; i++) {
      var c = cliffs[i % 13];
      var tombGroup = c.name + "（" + c.town + "）";
      var title = COFFIN_TITLES[i];
      var code = "SC-" + pad(i + 1);
      var reg = registryDefaultsFromSeed(i, code, title, tombGroup);
      arr.push(
        Object.assign(reg, {
          intro: "",
          modelFileName: "",
          _modelBlobUrl: "",
          _images: { ortho: [], rubbing: [], line: [], enhance: [] },
          _demoImages: {
            ortho: demoImageUrlsForSeed(i, "ortho"),
            rubbing: demoImageUrlsForSeed(i, "rubbing"),
            line: demoImageUrlsForSeed(i, "line"),
            enhance: demoImageUrlsForSeed(i, "enhance"),
          },
        })
      );
    }
    return arr;
  }

  var records = buildRecords();
  var els = {};
  var viewerState = { index: -1, imgKey: "ortho", imgSlot: 0 };

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg) {
    var t = $("coffin-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(function () {
      t.classList.remove("is-show");
    }, 2400);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function openModal(title, bodyHtml, footerHtml, modalClass) {
    var backdrop = $("coffin-modal");
    var box = backdrop && backdrop.querySelector(".admin-modal");
    if (!backdrop) return;
    $("coffin-modal-title").textContent = title;
    $("coffin-modal-body").innerHTML = bodyHtml;
    $("coffin-modal-footer").innerHTML = footerHtml || "";
    if (box) box.className = "admin-modal" + (modalClass ? " " + modalClass : "");
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var backdrop = $("coffin-modal");
    if (!backdrop) return;
    var mv = $("coffin-edit-mv");
    if (mv) mv.removeAttribute("src");
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    var box = backdrop.querySelector(".admin-modal");
    if (box) box.className = "admin-modal";
  }

  function openPreviewModal(title, src, isBlob) {
    var backdrop = $("coffin-preview-modal");
    if (!backdrop) return;
    $("coffin-preview-title").textContent = title;
    var img = $("coffin-preview-img");
    var ph = $("coffin-preview-placeholder");
    if (src) {
      img.src = src;
      img.hidden = false;
      ph.hidden = true;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
      ph.hidden = false;
      ph.textContent = "无法预览该格式（原型仅示意图片预览）";
    }
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    backdrop._isBlob = !!isBlob;
    backdrop._blobUrl = isBlob ? src : null;
  }

  function closePreviewModal() {
    var backdrop = $("coffin-preview-modal");
    if (!backdrop) return;
    if (backdrop._blobUrl) {
      try {
        URL.revokeObjectURL(backdrop._blobUrl);
      } catch (e) {}
    }
    backdrop._blobUrl = null;
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
  }

  function infoRow(label, text) {
    var v = text != null && String(text).trim() !== "" ? String(text) : "—";
    return (
      '<div class="cliff-info-row"><dt>' +
      escapeHtml(label) +
      "</dt><dd>" +
      escapeHtml(v) +
      "</dd></div>"
    );
  }

  function buildViewerRegistrySections(r) {
    return EDIT_SECTIONS.map(function (sec) {
      return (
        '<section class="cliff-info-section">' +
        '<h4 class="cliff-info-section-h">' +
        escapeHtml(sec.title) +
        "</h4>" +
        '<dl class="cliff-info-dl">' +
        sec.keys
          .map(function (key) {
            return infoRow(getCoffinLabel(key), r[key]);
          })
          .join("") +
        "</dl></section>"
      );
    }).join("");
  }

  function openViewerModal(index) {
    var r = records[index];
    if (!r) return;
    viewerState.index = index;
    viewerState.imgKey = "ortho";
    viewerState.imgSlot = 0;

    var backdrop = $("coffin-viewer-modal");
    if (!backdrop) return;

    var titleEl = $("coffin-viewer-title");
    if (titleEl) titleEl.textContent = "石棺信息";

    var codeEl = $("coffin-viewer-code");
    if (codeEl) codeEl.textContent = displayId(r);
    var nameEl = $("coffin-viewer-name");
    if (nameEl) nameEl.textContent = r.title || "—";

    var regRoot = $("coffin-viewer-registry");
    if (regRoot) regRoot.innerHTML = buildViewerRegistrySections(r);

    var introEl = $("coffin-viewer-intro");
    var text = (r.intro && r.intro.trim()) || defaultIntro(r);
    if (introEl) introEl.textContent = text;

    var modelSec = $("coffin-viewer-model-section");
    var imgsSec = $("coffin-viewer-imgs-section");
    if (modelSec) modelSec.hidden = true;
    if (imgsSec) imgsSec.hidden = true;

    var mv = $("coffin-viewer-mv");
    if (mv) mv.removeAttribute("src");

    var tabs = $("coffin-viewer-tabs");
    if (tabs) {
      tabs.innerHTML = IMG_KEYS.map(function (key) {
        return (
          '<button type="button" role="tab" class="coffin-img-tab' +
          (key === viewerState.imgKey ? " is-active" : "") +
          '" data-img-key="' +
          key +
          '">' +
          IMG_LABELS[key] +
          "</button>"
        );
      }).join("");
    }

    syncViewerImage();
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var body = backdrop.querySelector(".coffin-viewer-body");
    if (body) {
      try {
        body.scrollTop = 0;
      } catch (e) {}
    }
  }

  function revealCoffinModelSection() {
    var idx = viewerState.index;
    if (idx < 0) return;
    var r = records[idx];
    var sec = $("coffin-viewer-model-section");
    var mv = $("coffin-viewer-mv");
    if (!sec || !mv || !r) return;
    sec.hidden = false;
    mv.src = r._modelBlobUrl || DEFAULT_MODEL_GLB;
    mv.alt = displayId(r) + " 石棺三维模型";
    try {
      sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {}
    customElements.whenDefined("model-viewer").then(function () {
      if (typeof mv.resetTurntableRotation === "function") {
        try {
          mv.resetTurntableRotation(0);
        } catch (e) {}
      }
    });
  }

  function revealCoffinImgsSection() {
    var sec = $("coffin-viewer-imgs-section");
    if (!sec) return;
    sec.hidden = false;
    viewerState.imgKey = "ortho";
    viewerState.imgSlot = 0;
    var tabs = $("coffin-viewer-tabs");
    if (tabs) {
      tabs.querySelectorAll("[data-img-key]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-img-key") === "ortho");
      });
    }
    syncViewerImage();
    try {
      sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {}
  }

  function closeViewerModal() {
    var backdrop = $("coffin-viewer-modal");
    if (!backdrop) return;
    var mv = $("coffin-viewer-mv");
    if (mv) mv.removeAttribute("src");
    var modelSec = $("coffin-viewer-model-section");
    var imgsSec = $("coffin-viewer-imgs-section");
    if (modelSec) modelSec.hidden = true;
    if (imgsSec) imgsSec.hidden = true;
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    viewerState.index = -1;
    viewerState.imgSlot = 0;
  }

  function syncViewerImage() {
    var idx = viewerState.index;
    var key = viewerState.imgKey;
    if (idx < 0) return;
    var r = records[idx];
    if (!r) return;

    var list = getImageList(r, key);
    var n = list.length;
    var slot = viewerState.imgSlot;
    if (n > 0) {
      if (slot < 0) slot = 0;
      if (slot >= n) slot = n - 1;
      viewerState.imgSlot = slot;
    }

    var img = $("coffin-viewer-detail-img");
    var empty = $("coffin-viewer-img-empty");
    var cap = $("coffin-viewer-img-caption");
    var thumbs = $("coffin-viewer-thumbs");
    var prev = $("coffin-viewer-prev");
    var next = $("coffin-viewer-next");
    var hint = $("coffin-viewer-img-hint");

    if (hint) {
      ensureImages(r);
      var userCnt = r._images[key].length;
      if (n === 0) {
        hint.textContent = "";
      } else if (userCnt === 0) {
        hint.textContent =
          "当前为「模拟」数字成果图，共 " +
          n +
          " 张（正式环境上传实物后将替换）。可用缩略图或「‹ ›」切换预览多张。";
      } else if (n > 1) {
        hint.textContent = "当前类型共 " + n + " 张，可使用缩略图或「‹ ›」切换。";
      } else {
        hint.textContent = "当前类型 1 张。";
      }
    }

    if (img && empty) {
      if (n > 0) {
        var item = list[slot];
        img.src = item.url;
        img.alt = IMG_LABELS[key] + " · " + displayId(r);
        img.hidden = false;
        empty.hidden = true;
        if (cap) cap.textContent = item.name + "（" + (slot + 1) + " / " + n + "）";
      } else {
        img.removeAttribute("src");
        img.hidden = true;
        empty.hidden = false;
        if (cap) cap.textContent = "";
      }
    }

    if (prev && next) {
      if (n <= 1) {
        prev.disabled = true;
        next.disabled = true;
      } else {
        prev.disabled = slot <= 0;
        next.disabled = slot >= n - 1;
      }
    }

    if (thumbs) {
      if (n > 0) {
        thumbs.innerHTML = list
          .map(function (item, i) {
            return (
              '<button type="button" class="coffin-viewer-thumb' +
              (i === slot ? " is-active" : "") +
              '" data-img-slot="' +
              i +
              '" title="' +
              escapeHtml(item.name) +
              '"><img src="' +
              String(item.url).replace(/"/g, "&quot;") +
              '" alt="" loading="lazy" /></button>'
            );
          })
          .join("");
        thumbs.hidden = false;
      } else {
        thumbs.innerHTML = "";
        thumbs.hidden = true;
      }
    }

    var tabs = $("coffin-viewer-tabs");
    if (tabs) {
      tabs.querySelectorAll("[data-img-key]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-img-key") === key);
      });
    }
  }

  /** 拼成一条可检索文本：登记表全部字段 + 简介 + 模型文件名 + 已上传成果图文件名 */
  function buildCoffinSearchHaystack(r) {
    var parts = [];
    COFFIN_REGISTRY_FIELDS.forEach(function (f) {
      var v = r[f.key];
      if (v != null && String(v).trim()) parts.push(String(v));
    });
    var intro = r.intro != null ? String(r.intro) : "";
    intro = intro.replace(/<[^>]+>/g, " ");
    parts.push(intro);
    if (r.modelFileName) parts.push(String(r.modelFileName));
    ensureImages(r);
    IMG_KEYS.forEach(function (k) {
      (r._images[k] || []).forEach(function (it) {
        if (it && it.name) parts.push(String(it.name));
      });
    });
    return parts.join("\n").toUpperCase();
  }

  function parseCoffinSearchTokens(raw) {
    return String(raw || "")
      .trim()
      .split(/[\s\u3000、，,;；]+/)
      .map(function (t) {
        return t.trim().toUpperCase();
      })
      .filter(Boolean);
  }

  function getFiltered() {
    var raw = els.searchInp && els.searchInp.value ? els.searchInp.value : "";
    var tokens = parseCoffinSearchTokens(raw);
    return records
      .map(function (r, i) {
        return { r: r, i: i };
      })
      .filter(function (o) {
        if (!tokens.length) return true;
        var hay = buildCoffinSearchHaystack(o.r);
        var t;
        for (t = 0; t < tokens.length; t++) {
          if (hay.indexOf(tokens[t]) < 0) return false;
        }
        return true;
      });
  }

  function addCoffin() {
    var n = records.length + 1;
    var idx = records.length;
    var code = "SC-" + pad(n);
    var rec = Object.assign(createEmptyRegistryFields(), {
      code: code,
      registryType: "藏品总登记号",
      title: "新石棺（请编辑名称）",
      tombGroup: "",
      weightUnit: "kg",
      intro: "",
      modelFileName: "",
      _modelBlobUrl: "",
      _images: { ortho: [], rubbing: [], line: [], enhance: [] },
      _demoImages: {
        ortho: demoImageUrlsForSeed(idx, "ortho"),
        rubbing: demoImageUrlsForSeed(idx, "rubbing"),
        line: demoImageUrlsForSeed(idx, "line"),
        enhance: demoImageUrlsForSeed(idx, "enhance"),
      },
    });
    records.push(rec);
    renderGrid();
    openCoffinEditModal(records.length - 1);
    showToast("已新增 " + code + "，请完善登记表字段");
  }

  function updateFilterHint() {
    var hint = $("coffin-filter-hint");
    var totalEl = $("coffin-stat-total");
    if (totalEl) totalEl.textContent = String(records.length);
    if (hint) {
      var n = getFiltered().length;
      hint.textContent =
        "当前显示 " + n + " 具 · 台账共 " + records.length + " 具（数据为浏览器内存原型）";
    }
  }

  function buildRegistryEditHtml() {
    var parts = [];
    EDIT_SECTIONS.forEach(function (sec) {
      parts.push(
        '<div class="coffin-edit-section"><h3 class="coffin-detail-h">' +
          escapeHtml(sec.title) +
          "</h3>"
      );
      sec.keys.forEach(function (key) {
        var id = "coffin-f-" + key;
        parts.push(
          '<div class="admin-form-row"><label for="' +
            id +
            '">' +
            escapeHtml(getCoffinLabel(key)) +
            '</label><input type="text" id="' +
            id +
            '" class="admin-input" autocomplete="off" /></div>'
        );
      });
      parts.push("</div>");
    });
    return parts.join("");
  }

  function fillRegistryForm(r) {
    COFFIN_REGISTRY_FIELDS.forEach(function (f) {
      var el = $("coffin-f-" + f.key);
      if (el) el.value = r[f.key] != null ? r[f.key] : "";
    });
  }

  function readRegistryForm(r) {
    COFFIN_REGISTRY_FIELDS.forEach(function (f) {
      var el = $("coffin-f-" + f.key);
      if (el) r[f.key] = el.value.trim();
    });
  }

  function renderGrid() {
    var grid = els.grid;
    if (!grid) return;
    var rows = getFiltered();
    grid.innerHTML = "";
    updateFilterHint();

    if (!rows.length) {
      grid.innerHTML = '<p class="admin-muted coffin-grid-empty">无符合条件的石棺，请调整搜索关键词。</p>';
      return;
    }

    rows.forEach(function (o) {
      var r = o.r;
      var i = o.i;
      var thumb = getCardCoverOrthophotoUrl(r);
      var card = document.createElement("article");
      card.className = "coffin-card";
      card.setAttribute("data-coffin-index", String(i));
      var line1 = displayId(r);
      card.innerHTML =
        '<div class="coffin-card-thumb-wrap">' +
        (thumb
          ? '<div class="admin-media-expand-shell coffin-card-thumb-shell">' +
            '<img class="coffin-card-thumb" src="' +
            escapeHtml(thumb) +
            '" alt="" loading="lazy" />' +
            '<button type="button" class="admin-media-expand-fab" aria-label="放大查看封面图">放大</button>' +
            "</div>"
          : '<div class="coffin-card-thumb coffin-card-thumb--ph" aria-hidden="true"></div>') +
        "</div>" +
        '<div class="coffin-card-meta">' +
        '<div class="coffin-card-code">' +
        escapeHtml(line1) +
        "</div>" +
        '<div class="coffin-card-title" title="' +
        escapeHtml(r.title) +
        '">' +
        escapeHtml(r.title) +
        "</div>" +
        "</div>" +
        '<div class="coffin-card-actions">' +
        '<button type="button" class="btn btn-primary coffin-card-btn-3d">查看</button>' +
        '<button type="button" class="btn btn-ghost coffin-card-btn-edit">编辑</button>' +
        '<button type="button" class="btn btn-danger coffin-card-btn-del">删除</button>' +
        "</div>";
      grid.appendChild(card);
    });
  }

  function bindEditModelViewer(r) {
    customElements.whenDefined("model-viewer").then(function () {
      var mv = $("coffin-edit-mv");
      if (!mv) return;
      mv.src = r._modelBlobUrl || DEFAULT_MODEL_GLB;
    });
  }

  function renderEditImageList(r, key, index) {
    var listId = "cf-" + key + "-list-" + index;
    var cntId = "cf-" + key + "-count-" + index;
    var box = $(listId);
    var cnt = $(cntId);
    ensureImages(r);
    var arr = r._images[key];
    if (cnt) cnt.textContent = arr.length + " 张";
    if (!box) return;
    box.innerHTML = arr
      .map(function (item, slot) {
        return (
          '<div class="coffin-img-slot">' +
          '<span class="coffin-img-slot-name" title="' +
          escapeHtml(item.name) +
          '">' +
          escapeHtml(item.name) +
          "</span>" +
          '<button type="button" class="btn btn-ghost" data-cf-preview="' +
          key +
          '" data-cf-slot="' +
          slot +
          '" data-cf-idx="' +
          index +
          '">预览</button>' +
          '<button type="button" class="btn btn-ghost" data-cf-remove="' +
          key +
          '" data-cf-slot="' +
          slot +
          '" data-cf-idx="' +
          index +
          '">移除</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function openCoffinEditModal(index) {
    var r = records[index];
    if (!r) return;

    var modelStatus = r.modelFileName
      ? "已关联：" + escapeHtml(r.modelFileName)
      : "未上传三维文件（预览使用示范模型）";

    var imgRows = IMG_KEYS.map(function (key) {
      return (
        '<div class="coffin-img-row">' +
        '<div class="coffin-img-row-head"><strong>' +
        IMG_LABELS[key] +
        '（JPG，每类可多张）</strong><span class="admin-muted" id="cf-' +
        key +
        "-count-" +
        index +
        '">0 张</span></div>' +
        '<div class="coffin-img-list" id="cf-' +
        key +
        "-list-" +
        index +
        '"></div>' +
        '<div class="coffin-img-row-body">' +
        '<input type="file" class="admin-input" id="cf-' +
        key +
        "-file-" +
        index +
        '" multiple accept="image/jpeg,image/jpg,.jpg,.jpeg,image/png,.png,image/webp,.webp" />' +
        '<span class="admin-muted" style="font-size:0.82rem;margin-left:8px">可多选追加，单类约 4～5 张</span>' +
        "</div></div>"
      );
    }).join("");

    var html =
      '<p class="admin-hint" style="margin-top:0">请逐项填写登记表字段（与 Excel 台账列一致）。</p>' +
      buildRegistryEditHtml() +
      '<div class="coffin-detail-section"><h3 class="coffin-detail-h">简介说明</h3>' +
      '<textarea class="admin-textarea" id="coffin-intro" style="min-height:100px" placeholder="石棺形制、画像题材、保存状况等"></textarea></div>' +
      '<div class="coffin-detail-section"><h3 class="coffin-detail-h">三维模型</h3>' +
      '<p class="admin-muted" style="margin:0 0 8px;font-size:0.82rem">' +
      modelStatus +
      " · 支持 GLB/GLTF，拖拽旋转、滚轮缩放。</p>" +
      '<div class="admin-form-row" style="margin-bottom:10px"><label>上传/替换</label><input type="file" id="coffin-model-file" class="admin-input" accept=".glb,.gltf,model/*" /></div>' +
      '<div class="admin-media-expand-shell">' +
      '<model-viewer id="coffin-edit-mv" class="coffin-model-viewer coffin-model-viewer--edit" camera-controls touch-action="pan-y" interaction-prompt="none" shadow-intensity="1" environment-image="neutral" alt="石棺三维编辑预览"></model-viewer>' +
      '<button type="button" class="admin-media-expand-fab" aria-label="放大查看三维预览">放大</button>' +
      "</div>" +
      "</div>" +
      '<div class="coffin-detail-section"><h3 class="coffin-detail-h">数字成果图</h3>' +
      '<p class="admin-muted" style="margin:0 0 10px;font-size:0.82rem">每类可维护多张；未上传时查看端仍显示示意组图。</p>' +
      imgRows +
      "</div>";

    openModal(
      "石棺编辑 · " + displayId(r),
      html,
      '<button type="button" class="btn" data-modal-cancel>取消</button><button type="button" class="btn btn-primary" data-coffin-save>保存</button>',
      "admin-modal--xl"
    );

    fillRegistryForm(r);

    var introEl = $("coffin-intro");
    if (introEl) introEl.value = r.intro || "";

    bindEditModelViewer(r);

    IMG_KEYS.forEach(function (key) {
      renderEditImageList(r, key, index);
    });

    var mf = $("coffin-model-file");
    if (mf) {
      mf.addEventListener("change", function () {
        var f = mf.files && mf.files[0];
        if (!f) return;
        try {
          if (r._modelBlobUrl && r._modelBlobUrl.indexOf("blob:") === 0) {
            URL.revokeObjectURL(r._modelBlobUrl);
          }
        } catch (e) {}
        r._modelBlobUrl = URL.createObjectURL(f);
        r.modelFileName = f.name;
        var mv = $("coffin-edit-mv");
        if (mv) mv.src = r._modelBlobUrl;
        showToast("已选择模型：" + f.name);
      });
    }

    IMG_KEYS.forEach(function (key) {
      var fid = "cf-" + key + "-file-" + index;
      var inp = $(fid);
      if (inp) {
        inp.addEventListener("change", function () {
          var files = inp.files;
          if (!files || !files.length) return;
          ensureImages(r);
          var fi;
          for (fi = 0; fi < files.length; fi++) {
            var f = files[fi];
            r._images[key].push({
              name: f.name,
              url: URL.createObjectURL(f),
            });
          }
          inp.value = "";
          renderEditImageList(r, key, index);
          renderGrid();
          showToast("已追加 " + files.length + " 张至「" + IMG_LABELS[key] + "」");
        });
      }
    });

    var foot = $("coffin-modal-footer");
    if (foot) {
      foot.querySelector("[data-coffin-save]").onclick = function () {
        readRegistryForm(r);
        var intro = $("coffin-intro");
        r.intro = intro ? intro.value.trim() : "";
        var mfile = $("coffin-model-file");
        if (mfile && mfile.files && mfile.files[0]) r.modelFileName = mfile.files[0].name;
        var mv = $("coffin-edit-mv");
        if (mv) mv.removeAttribute("src");
        closeModal();
        renderGrid();
        showToast("已保存「" + displayId(r) + "」");
      };
    }
  }

  function exportCsv() {
    var rows = getFiltered();
    var headers = COFFIN_REGISTRY_FIELDS.map(function (f) {
      return f.label;
    });
    var lines = [headers.join(",")];
    rows.forEach(function (o) {
      var r = o.r;
      var cells = COFFIN_REGISTRY_FIELDS.map(function (f) {
        var v = r[f.key] != null ? String(r[f.key]) : "";
        return '"' + v.replace(/"/g, '""') + '"';
      });
      lines.push(cells.join(","));
    });
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "合江石棺登记表_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("已导出 " + rows.length + " 条");
  }

  function resetFilters() {
    if (els.searchInp) els.searchInp.value = "";
    renderGrid();
    showToast("已清空搜索");
  }

  function revokeCoffinAssets(r) {
    if (!r) return;
    if (r._modelBlobUrl && String(r._modelBlobUrl).indexOf("blob:") === 0) {
      try {
        URL.revokeObjectURL(r._modelBlobUrl);
      } catch (e) {}
    }
    ensureImages(r);
    IMG_KEYS.forEach(function (k) {
      (r._images[k] || []).forEach(function (it) {
        if (it && it.url && String(it.url).indexOf("blob:") === 0) {
          try {
            URL.revokeObjectURL(it.url);
          } catch (e) {}
        }
      });
    });
  }

  function removeCoffinAt(index) {
    if (index < 0 || index >= records.length) return;
    var rec = records[index];
    var idText = displayId(rec) || "该记录";
    if (!window.confirm("确认删除「" + idText + "」吗？删除后不可恢复。")) return;
    revokeCoffinAssets(rec);
    records.splice(index, 1);
    renderGrid();
    showToast("已删除「" + idText + "」");
  }

  function bind() {
    els.grid = $("coffin-grid");
    els.searchInp = $("coffin-filter-q");

    if (els.searchInp) {
      els.searchInp.addEventListener("input", function () {
        renderGrid();
      });
    }

    if ($("btn-coffin-search")) {
      $("btn-coffin-search").onclick = function () {
        renderGrid();
        showToast("共 " + getFiltered().length + " 具");
      };
    }
    if ($("btn-coffin-reset")) {
      $("btn-coffin-reset").onclick = resetFilters;
    }
    if ($("btn-coffin-export")) {
      $("btn-coffin-export").onclick = exportCsv;
    }
    if ($("btn-coffin-add")) {
      $("btn-coffin-add").onclick = addCoffin;
    }

    if (els.grid) {
      els.grid.addEventListener("click", function (e) {
        var card = e.target.closest(".coffin-card[data-coffin-index]");
        if (!card) return;
        var idx = parseInt(card.getAttribute("data-coffin-index"), 10);
        if (e.target.closest(".coffin-card-btn-3d")) {
          openViewerModal(idx);
          return;
        }
        if (e.target.closest(".coffin-card-btn-edit")) {
          openCoffinEditModal(idx);
          return;
        }
        if (e.target.closest(".coffin-card-btn-del")) {
          removeCoffinAt(idx);
        }
      });
    }

    var vm = $("coffin-viewer-modal");
    if (vm) {
      vm.addEventListener("click", function (e) {
        if (e.target === vm || e.target.closest("[data-viewer-close]")) closeViewerModal();
      });
      vm.addEventListener("click", function (e) {
        var tab = e.target.closest("[data-img-key]");
        if (!tab || !vm.contains(tab)) return;
        viewerState.imgKey = tab.getAttribute("data-img-key");
        viewerState.imgSlot = 0;
        syncViewerImage();
      });
      vm.addEventListener("click", function (e) {
        var th = e.target.closest(".coffin-viewer-thumb[data-img-slot]");
        if (!th || !vm.contains(th)) return;
        var s = parseInt(th.getAttribute("data-img-slot"), 10);
        if (!isNaN(s)) {
          viewerState.imgSlot = s;
          syncViewerImage();
        }
      });
    }

    if ($("coffin-viewer-prev")) {
      $("coffin-viewer-prev").addEventListener("click", function (e) {
        e.stopPropagation();
        if (viewerState.index < 0) return;
        viewerState.imgSlot -= 1;
        syncViewerImage();
      });
    }
    if ($("coffin-viewer-next")) {
      $("coffin-viewer-next").addEventListener("click", function (e) {
        e.stopPropagation();
        if (viewerState.index < 0) return;
        viewerState.imgSlot += 1;
        syncViewerImage();
      });
    }

    if ($("coffin-viewer-btn-model")) {
      $("coffin-viewer-btn-model").addEventListener("click", function (e) {
        e.stopPropagation();
        revealCoffinModelSection();
      });
    }
    if ($("coffin-viewer-btn-imgs")) {
      $("coffin-viewer-btn-imgs").addEventListener("click", function (e) {
        e.stopPropagation();
        revealCoffinImgsSection();
      });
    }

    var m = $("coffin-modal");
    if (m) {
      m.addEventListener("click", function (e) {
        if (e.target === m) closeModal();
      });
      var mClose = m.querySelector(".admin-modal-close");
      if (mClose) mClose.addEventListener("click", closeModal);
      m.addEventListener("click", function (e) {
        if (e.target.closest("[data-modal-cancel]")) closeModal();
      });
      m.addEventListener("click", function (e) {
        var prev = e.target.closest("[data-cf-preview]");
        if (prev && m.contains(prev)) {
          var pkey = prev.getAttribute("data-cf-preview");
          var slot = parseInt(prev.getAttribute("data-cf-slot"), 10);
          var idx = parseInt(prev.getAttribute("data-cf-idx"), 10);
          var rec = records[idx];
          if (rec && rec._images && rec._images[pkey] && rec._images[pkey][slot]) {
            var it = rec._images[pkey][slot];
            openPreviewModal(IMG_LABELS[pkey] + " · " + it.name, it.url, true);
          }
          return;
        }
        var rm = e.target.closest("[data-cf-remove]");
        if (rm && m.contains(rm)) {
          var rkey = rm.getAttribute("data-cf-remove");
          var rslot = parseInt(rm.getAttribute("data-cf-slot"), 10);
          var ridx = parseInt(rm.getAttribute("data-cf-idx"), 10);
          var rrec = records[ridx];
          if (!rrec || !rrec._images || !rrec._images[rkey]) return;
          var rit = rrec._images[rkey][rslot];
          if (rit && rit.url && String(rit.url).indexOf("blob:") === 0) {
            try {
              URL.revokeObjectURL(rit.url);
            } catch (err) {}
          }
          rrec._images[rkey].splice(rslot, 1);
          renderEditImageList(rrec, rkey, ridx);
          renderGrid();
        }
      });
    }

    var pm = $("coffin-preview-modal");
    if (pm) {
      pm.addEventListener("click", function (e) {
        if (e.target === pm || e.target.closest("[data-preview-close]")) closePreviewModal();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (window.AdminMediaExpand && window.AdminMediaExpand.isOpen()) return;
      if (pm && !pm.hidden) closePreviewModal();
      else if (vm && !vm.hidden) closeViewerModal();
      else if (m && !m.hidden) closeModal();
    });
  }

  function init() {
    if (!$("coffin-grid")) return;
    bind();
    renderGrid();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
