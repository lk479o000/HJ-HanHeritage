/**
 * 资源管理：多级目录、多类型资源、上传/预览/统计（原型，数据驻留内存）
 */
(function () {
  "use strict";

  var RESOURCE_TYPES = {
    doc: "数字文档",
    image: "平面影像",
    model: "三维模型",
    scan: "扫描数据",
    pointcloud: "点云数据",
    deliverable: "成果数据",
    video: "视频",
  };

  var DEMO_MODEL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
  var DEMO_IMG = "https://pannellum.org/images/alma.jpg";
  var DEMO_PDF = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
  var DEMO_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

  var folders = [];
  var files = [];
  var currentFolderId = null;
  var expanded = {};
  var filterKeyword = "";
  var filterType = "";
  var selectedFileIds = {};

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg) {
    var t = $("res-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(function () {
      t.classList.remove("is-show");
    }, 2600);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function formatSize(n) {
    if (n == null || isNaN(n)) return "—";
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }

  function uid() {
    return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function seedData() {
    folders = [
      { id: "fd1", name: "合江", parentId: null, level: 1 },
      { id: "fd2", name: "三维模型", parentId: "fd1", level: 2 },
      { id: "fd3", name: "1号石棺", parentId: "fd2", level: 3 },
      { id: "fd4", name: "2号石棺", parentId: "fd2", level: 3 },
      { id: "fd5", name: "平面影像", parentId: "fd1", level: 2 },
      { id: "fd6", name: "正射影像集", parentId: "fd5", level: 3 },
    ];
    files = [
      {
        id: "fl1",
        folderId: "fd3",
        name: "棺体展示.glb",
        resourceType: "model",
        size: 12582912,
        updated: "2026-03-18",
        remark: "示范三维，可在线旋转预览",
        ext: "glb",
        remoteUrl: DEMO_MODEL,
      },
      {
        id: "fl2",
        folderId: "fd3",
        name: "点云抽样.las",
        resourceType: "pointcloud",
        size: 4194304,
        updated: "2026-03-19",
        remark: "大文件需专用查看器，此处仅登记",
        ext: "las",
      },
      {
        id: "fl3",
        folderId: "fd6",
        name: "分布示意图.jpg",
        resourceType: "image",
        size: 892000,
        updated: "2026-03-20",
        remark: "",
        ext: "jpg",
        remoteUrl: DEMO_IMG,
      },
      {
        id: "fl4",
        folderId: "fd6",
        name: "说明文档.pdf",
        resourceType: "doc",
        size: 1024000,
        updated: "2026-03-15",
        remark: "登记表摘录",
        ext: "pdf",
        remoteUrl: DEMO_PDF,
      },
      {
        id: "fl5",
        folderId: "fd5",
        name: "现场视频.mp4",
        resourceType: "video",
        size: 5242880,
        updated: "2026-03-10",
        remark: "",
        ext: "mp4",
        remoteUrl: DEMO_VIDEO,
      },
    ];
    expanded.fd1 = true;
    expanded.fd2 = true;
    expanded.fd5 = true;
    currentFolderId = "fd3";
    ["fd1", "fd2", "fd3", "fd4", "fd5", "fd6"].forEach(function (id) {
      expanded[id] = true;
    });
  }

  function getFolder(id) {
    var i;
    for (i = 0; i < folders.length; i++) {
      if (folders[i].id === id) return folders[i];
    }
    return null;
  }

  function getChildren(parentId) {
    return folders
      .filter(function (f) {
        return f.parentId === parentId;
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name, "zh-CN");
      });
  }

  function getBreadcrumb(id) {
    var parts = [];
    var cur = id;
    while (cur) {
      var f = getFolder(cur);
      if (!f) break;
      parts.unshift(f.name);
      cur = f.parentId;
    }
    return parts;
  }

  function removeFolderCascade(fid) {
    getChildren(fid).forEach(function (c) {
      removeFolderCascade(c.id);
    });
    files = files.filter(function (x) {
      return x.folderId !== fid;
    });
    folders = folders.filter(function (x) {
      return x.id !== fid;
    });
  }

  function totalSizeBytes() {
    return files.reduce(function (s, f) {
      return s + (f.size || 0);
    }, 0);
  }

  function countByType() {
    var o = {};
    Object.keys(RESOURCE_TYPES).forEach(function (k) {
      o[k] = 0;
    });
    files.forEach(function (f) {
      if (o[f.resourceType] != null) o[f.resourceType]++;
    });
    return o;
  }

  function getFilteredFiles() {
    return files.filter(function (f) {
      if (f.folderId !== currentFolderId) return false;
      if (filterType && f.resourceType !== filterType) return false;
      if (filterKeyword) {
        var q = filterKeyword.toLowerCase();
        if (
          String(f.name).toLowerCase().indexOf(q) < 0 &&
          String(f.remark || "")
            .toLowerCase()
            .indexOf(q) < 0
        )
          return false;
      }
      return true;
    });
  }

  function closeModal() {
    var b = $("res-modal");
    if (!b) return;
    b.hidden = true;
    b.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openModal(title, bodyHtml, footerHtml) {
    var b = $("res-modal");
    var titleEl = $("res-modal-title");
    var bodyEl = $("res-modal-body");
    var footEl = $("res-modal-footer");
    if (!b || !titleEl || !bodyEl || !footEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    footEl.innerHTML = footerHtml || "";
    b.hidden = false;
    b.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePreview() {
    var b = $("res-preview-backdrop");
    var host = $("res-preview-host");
    if (host) host.innerHTML = "";
    if (b) {
      b.hidden = true;
      b.setAttribute("aria-hidden", "true");
    }
  }

  function openPreview(file) {
    var b = $("res-preview-backdrop");
    var title = $("res-preview-title");
    var host = $("res-preview-host");
    if (!b || !host) return;
    if (title) title.textContent = "预览 · " + file.name;
    host.innerHTML = "";
    var ext = (file.ext || "").toLowerCase();
    var url = file._blobUrl || file.remoteUrl;

    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].indexOf(ext) >= 0 && url) {
      host.innerHTML = '<img alt="" src="' + escapeHtml(url) + '" />';
    } else if (["mp4", "webm", "ogg"].indexOf(ext) >= 0 && url) {
      host.innerHTML =
        '<video controls playsinline src="' + escapeHtml(url) + '">不支持视频标签</video>';
    } else if (ext === "pdf" && url) {
      host.innerHTML =
        '<iframe title="PDF" src="' + escapeHtml(url) + '"></iframe>';
    } else if (["glb", "gltf"].indexOf(ext) >= 0 && url) {
      host.innerHTML =
        '<model-viewer class="res-preview-model" camera-controls touch-action="pan-y" interaction-prompt="none" shadow-intensity="1" environment-image="neutral" alt="三维预览"></model-viewer>';
      var applyMv = function () {
        var mv = host.querySelector("model-viewer");
        if (mv) mv.setAttribute("src", url);
      };
      if (window.customElements && typeof customElements.whenDefined === "function") {
        customElements.whenDefined("model-viewer").then(applyMv);
      } else {
        setTimeout(applyMv, 200);
      }
    } else if (["txt", "md", "csv", "json", "xml"].indexOf(ext) >= 0 && file._textContent != null) {
      host.innerHTML =
        '<pre class="res-preview-text">' + escapeHtml(file._textContent) + "</pre>";
    } else {
      host.innerHTML =
        '<div class="res-preview-fallback">' +
        "<p><strong>" +
        escapeHtml(file.name) +
        "</strong></p>" +
        "<p>当前格式（." +
        escapeHtml(ext || "—") +
        "）在原型中未配置在线预览，请使用「下载」到本地查看。" +
        (file.resourceType === "pointcloud" || file.resourceType === "scan"
          ? "<br />点云 / 扫描数据正式环境可对接专用 Web 查看器。</p>"
          : "</p>") +
        "</div>";
    }

    b.hidden = false;
    b.setAttribute("aria-hidden", "false");
  }

  function downloadFile(file) {
    var url = file._blobUrl || file.remoteUrl;
    if (!url) {
      showToast("无可用下载地址（请先上传或使用示范资源）");
      return;
    }
    var a = document.createElement("a");
    a.href = url;
    a.download = file.name || "download";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("已开始下载（浏览器可能另开标签页打开远程文件）");
  }

  function deleteFiles(ids) {
    var idset = {};
    ids.forEach(function (id) {
      idset[id] = true;
    });
    files.forEach(function (f) {
      if (idset[f.id] && f._blobUrl && String(f._blobUrl).indexOf("blob:") === 0) {
        try {
          URL.revokeObjectURL(f._blobUrl);
        } catch (e) {}
      }
    });
    files = files.filter(function (f) {
      return !idset[f.id];
    });
    selectedFileIds = {};
  }

  function renderStatsBar() {
    var el = $("res-stats-bar");
    if (!el) return;
    var total = files.length;
    var bytes = totalSizeBytes();
    var inFolder = files.filter(function (f) {
      return f.folderId === currentFolderId;
    }).length;
    el.innerHTML =
      '<span class="res-stat-pill">资源总数 <strong>' +
      total +
      "</strong></span>" +
      '<span class="res-stat-pill">总占用 <strong>' +
      formatSize(bytes) +
      "</strong></span>" +
      '<span class="res-stat-pill">当前目录条目 <strong>' +
      inFolder +
      "</strong></span>";
  }

  function renderBreadcrumb() {
    var el = $("res-breadcrumb");
    if (!el) return;
    var path = getBreadcrumb(currentFolderId);
    el.innerHTML =
      "当前位置：<strong>" + (path.length ? escapeHtml(path.join(" / ")) : "—") + "</strong>";
  }

  function renderTable() {
    var tb = $("res-file-tbody");
    if (!tb) return;
    var rows = getFilteredFiles();
    tb.innerHTML = "";
    rows.forEach(function (f) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><input type="checkbox" class="res-file-cb" data-fid="' +
        escapeHtml(f.id) +
        '" ' +
        (selectedFileIds[f.id] ? "checked" : "") +
        "/></td>" +
        "<td>" +
        escapeHtml(f.name) +
        "</td>" +
        '<td><span class="res-type-tag">' +
        escapeHtml(RESOURCE_TYPES[f.resourceType] || f.resourceType) +
        "</span></td>" +
        "<td>" +
        escapeHtml((f.ext || "—").toUpperCase()) +
        "</td>" +
        "<td>" +
        formatSize(f.size) +
        "</td>" +
        "<td>" +
        escapeHtml(f.updated || "—") +
        "</td>" +
        "<td>" +
        escapeHtml(f.remark || "—") +
        "</td>" +
        "<td>" +
        '<button type="button" class="btn btn-ghost res-op-prev" data-fid="' +
        f.id +
        '">浏览</button> ' +
        '<button type="button" class="btn btn-ghost res-op-dl" data-fid="' +
        f.id +
        '">下载</button> ' +
        '<button type="button" class="btn btn-ghost res-op-edit" data-fid="' +
        f.id +
        '">编辑</button> ' +
        '<button type="button" class="btn btn-ghost res-op-del" data-fid="' +
        f.id +
        '">删除</button>' +
        "</td>";
      tb.appendChild(tr);
    });
    if (!rows.length) {
      var tr0 = document.createElement("tr");
      tr0.innerHTML =
        '<td colspan="8" class="admin-muted" style="text-align:center;padding:28px">当前目录无资源或无匹配查询结果。可「上传」或使用上方查询条件。</td>';
      tb.appendChild(tr0);
    }
    var sa = $("res-select-all");
    if (sa) sa.checked = false;
  }

  function renderTree() {
    var root = $("res-tree-root");
    if (!root) return;
    root.innerHTML = "";
    var ul = document.createElement("ul");
    ul.className = "res-tree";
    getChildren(null).forEach(function (node) {
      ul.appendChild(buildTreeNode(node));
    });
    root.appendChild(ul);
  }

  function buildTreeNode(folder) {
    var li = document.createElement("li");
    li.className = "res-tree-node";
    var row = document.createElement("div");
    row.className = "res-tree-row" + (folder.id === currentFolderId ? " is-active" : "");
    row.dataset.fid = folder.id;

    var kids = getChildren(folder.id);
    var hasKids = kids.length > 0;
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "res-tree-toggle" + (hasKids ? "" : " is-empty");
    toggle.textContent = hasKids ? (expanded[folder.id] ? "▼" : "▶") : "·";
    if (hasKids) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        expanded[folder.id] = !expanded[folder.id];
        renderTree();
      });
    }

    var label = document.createElement("span");
    label.className = "res-tree-label";
    label.textContent = folder.name;
    label.title = folder.name;

    var actions = document.createElement("span");
    actions.className = "res-tree-actions";
    if (folder.level < 3) {
      actions.innerHTML =
        '<button type="button" data-act="add" data-fid="' +
        folder.id +
        '" title="新建子目录">+</button>';
    }
    actions.innerHTML +=
      '<button type="button" data-act="ren" data-fid="' +
      folder.id +
      '" title="重命名">改</button>' +
      '<button type="button" data-act="del" data-fid="' +
      folder.id +
      '" title="删除">删</button>';

    row.appendChild(toggle);
    row.appendChild(label);
    row.appendChild(actions);

    row.addEventListener("click", function (e) {
      if (e.target.closest(".res-tree-actions")) return;
      currentFolderId = folder.id;
      selectedFileIds = {};
      refreshMain();
      renderTree();
    });

    actions.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      e.stopPropagation();
      var act = btn.getAttribute("data-act");
      var fid = btn.getAttribute("data-fid");
      if (act === "add") openMenuModal(fid);
      else if (act === "ren") openRenameModal(fid);
      else if (act === "del") confirmDeleteFolder(fid);
    });

    li.appendChild(row);

    if (hasKids && expanded[folder.id]) {
      var sub = document.createElement("ul");
      kids.forEach(function (ch) {
        sub.appendChild(buildTreeNode(ch));
      });
      li.appendChild(sub);
    }

    return li;
  }

  function confirmDeleteFolder(fid) {
    var f = getFolder(fid);
    if (!f) return;
    if (!window.confirm('确定删除目录「' + f.name + "」及其下所有子目录与资源？（原型内存数据）")) return;
    removeFolderCascade(fid);
    if (!getFolder(currentFolderId)) {
      currentFolderId = folders.length ? folders[0].id : null;
    }
    showToast("已删除目录");
    refreshAll();
  }

  function openMenuModal(parentId) {
    var parent = parentId ? getFolder(parentId) : null;
    var level = parent ? parent.level + 1 : 1;
    if (level > 3) {
      showToast("目录最多三级（例：合江 → 三维模型 → 1号石棺）");
      return;
    }
    openModal(
      parentId ? "新建子目录" : "新建根目录",
      '<div class="admin-form-row"><label>目录名称</label><input type="text" class="admin-input" id="res-menu-name" placeholder="如 1号石棺" /></div>' +
        (parentId
          ? '<p class="admin-muted" style="margin:0;font-size:0.82rem">父级：' +
            escapeHtml(getBreadcrumb(parentId).join(" / ")) +
            " · 将创建为第 " +
            level +
            " 级</p>"
          : '<p class="admin-muted" style="margin:0;font-size:0.82rem">将创建为第一级（如区域名「合江」）</p>'),
      '<button type="button" class="btn" data-res-close>取消</button><button type="button" class="btn btn-primary" id="res-menu-save">确定</button>'
    );
    $("res-menu-save").onclick = function () {
      var name = ($("res-menu-name") && $("res-menu-name").value.trim()) || "";
      if (!name) {
        showToast("请填写目录名称");
        return;
      }
      folders.push({
        id: uid(),
        name: name,
        parentId: parentId,
        level: level,
      });
      if (parentId) expanded[parentId] = true;
      closeModal();
      showToast("目录已创建");
      refreshAll();
    };
  }

  function openRenameModal(fid) {
    var f = getFolder(fid);
    if (!f) return;
    openModal(
      "重命名目录",
      '<div class="admin-form-row"><label>目录名称</label><input type="text" class="admin-input" id="res-rename-in" value="' +
        escapeHtml(f.name) +
        '" /></div>',
      '<button type="button" class="btn" data-res-close>取消</button><button type="button" class="btn btn-primary" id="res-rename-save">保存</button>'
    );
    $("res-rename-save").onclick = function () {
      var v = ($("res-rename-in") && $("res-rename-in").value.trim()) || "";
      if (!v) return;
      f.name = v;
      closeModal();
      showToast("已更新");
      refreshAll();
    };
  }

  function openEditFileModal(file) {
    var opts = Object.keys(RESOURCE_TYPES)
      .map(function (k) {
        return (
          '<option value="' +
          k +
          '"' +
          (file.resourceType === k ? " selected" : "") +
          ">" +
          escapeHtml(RESOURCE_TYPES[k]) +
          "</option>"
        );
      })
      .join("");
    openModal(
      "编辑资源信息 · " + file.name,
      '<div class="admin-form-row"><label>显示名称</label><input type="text" class="admin-input" id="res-meta-name" value="' +
        escapeHtml(file.name) +
        '" /></div>' +
        '<div class="admin-form-row"><label>资源类型</label><select class="admin-select" id="res-meta-type">' +
        opts +
        "</select></div>" +
        '<div class="admin-form-row"><label>说明</label><textarea class="admin-textarea" id="res-meta-remark" rows="3">' +
        escapeHtml(file.remark || "") +
        "</textarea></div>",
      '<button type="button" class="btn" data-res-close>取消</button><button type="button" class="btn btn-primary" id="res-meta-save">保存</button>'
    );
    $("res-meta-save").onclick = function () {
      file.name = ($("res-meta-name") && $("res-meta-name").value.trim()) || file.name;
      file.resourceType = ($("res-meta-type") && $("res-meta-type").value) || file.resourceType;
      file.remark = ($("res-meta-remark") && $("res-meta-remark").value.trim()) || "";
      closeModal();
      showToast("已保存");
      refreshMain();
    };
  }

  function openStatsModal() {
    var by = countByType();
    var parts = Object.keys(RESOURCE_TYPES)
      .map(function (k) {
        return (
          '<div class="res-stats-card"><h4>' +
          escapeHtml(RESOURCE_TYPES[k]) +
          '</h4><div class="num">' +
          by[k] +
          "</div></div>"
        );
      })
      .join("");
    openModal(
      "资源统计（当前原型数据）",
      '<p class="admin-muted" style="margin:0 0 12px">以下为内存台账汇总；正式环境对接数据库与对象存储。</p>' +
        '<div class="res-stats-grid">' +
        parts +
        "</div>" +
        '<p style="margin:16px 0 0;font-size:0.88rem">目录节点数：<strong>' +
        folders.length +
        "</strong>　资源文件数：<strong>" +
        files.length +
        "</strong>　总大小：<strong>" +
        formatSize(totalSizeBytes()) +
        "</strong></p>",
      '<button type="button" class="btn btn-primary" data-res-close>关闭</button>'
    );
  }

  function handleUpload(filesInput) {
    var list = filesInput.files;
    if (!list || !list.length) return;
    if (!currentFolderId) {
      showToast("请先在左侧选择目录");
      return;
    }
    var total = list.length;
    var done = 0;
    function finishOne() {
      done++;
      if (done === total) {
        filesInput.value = "";
        showToast("已添加 " + total + " 个文件到当前目录");
        refreshMain();
      }
    }
    var fi;
    for (fi = 0; fi < list.length; fi++) {
      (function (file) {
        var ext = (file.name.split(".").pop() || "").toLowerCase();
        var type = guessType(ext);
        var rec = {
          id: uid(),
          folderId: currentFolderId,
          name: file.name,
          resourceType: type,
          size: file.size,
          updated: new Date().toISOString().slice(0, 10),
          remark: "",
          ext: ext,
        };
        if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "mp4", "webm", "pdf", "glb", "gltf"].indexOf(ext) >= 0) {
          rec._blobUrl = URL.createObjectURL(file);
        }
        if (["txt", "md", "csv", "json", "xml"].indexOf(ext) >= 0) {
          var reader = new FileReader();
          reader.onload = function () {
            rec._textContent = reader.result;
            files.push(rec);
            finishOne();
          };
          reader.onerror = function () {
            files.push(rec);
            finishOne();
          };
          reader.readAsText(file, "UTF-8");
          return;
        }
        files.push(rec);
        finishOne();
      })(list[fi]);
    }
  }

  function guessType(ext) {
    if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md"].indexOf(ext) >= 0) return "doc";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tif", "tiff"].indexOf(ext) >= 0) return "image";
    if (["glb", "gltf", "obj", "fbx"].indexOf(ext) >= 0) return "model";
    if (["las", "laz", "e57", "ply"].indexOf(ext) >= 0) return "pointcloud";
    if (["mp4", "webm", "ogg", "mov"].indexOf(ext) >= 0) return "video";
    if (["zip", "rar", "7z"].indexOf(ext) >= 0) return "deliverable";
    return "scan";
  }

  function refreshMain() {
    renderStatsBar();
    renderBreadcrumb();
    renderTable();
  }

  function refreshAll() {
    renderTree();
    refreshMain();
  }

  function bind() {
    $("res-tree-add-root") &&
      $("res-tree-add-root").addEventListener("click", function () {
        openMenuModal(null);
      });

    $("res-btn-upload") &&
      $("res-btn-upload").addEventListener("click", function () {
        $("res-file-input").click();
      });
    $("res-file-input") &&
      $("res-file-input").addEventListener("change", function () {
        handleUpload($("res-file-input"));
      });

    $("res-btn-batch-del") &&
      $("res-btn-batch-del").addEventListener("click", function () {
        var ids = Object.keys(selectedFileIds).filter(function (k) {
          return selectedFileIds[k];
        });
        if (!ids.length) {
          showToast("请先勾选要删除的资源");
          return;
        }
        if (!window.confirm("确定删除选中的 " + ids.length + " 条资源？")) return;
        deleteFiles(ids);
        showToast("已删除");
        refreshMain();
      });

    $("res-btn-stats") &&
      $("res-btn-stats").addEventListener("click", function () {
        openStatsModal();
      });

    $("res-filter-keyword") &&
      $("res-filter-keyword").addEventListener("input", function () {
        filterKeyword = $("res-filter-keyword").value.trim();
        refreshMain();
      });
    $("res-filter-type") &&
      $("res-filter-type").addEventListener("change", function () {
        filterType = $("res-filter-type").value;
        refreshMain();
      });
    $("res-filter-reset") &&
      $("res-filter-reset").addEventListener("click", function () {
        filterKeyword = "";
        filterType = "";
        if ($("res-filter-keyword")) $("res-filter-keyword").value = "";
        if ($("res-filter-type")) $("res-filter-type").value = "";
        refreshMain();
      });

    $("res-file-tbody") &&
      $("res-file-tbody").addEventListener("change", function (e) {
        var cb = e.target.closest(".res-file-cb");
        if (!cb) return;
        var fid = cb.getAttribute("data-fid");
        selectedFileIds[fid] = cb.checked;
      });

    $("res-file-tbody") &&
      $("res-file-tbody").addEventListener("click", function (e) {
        var prev = e.target.closest(".res-op-prev");
        var dl = e.target.closest(".res-op-dl");
        var ed = e.target.closest(".res-op-edit");
        var del = e.target.closest(".res-op-del");
        var fid = (prev || dl || ed || del) && (prev || dl || ed || del).getAttribute("data-fid");
        if (!fid) return;
        var file = files.filter(function (x) {
          return x.id === fid;
        })[0];
        if (!file) return;
        if (prev) openPreview(file);
        else if (dl) downloadFile(file);
        else if (ed) openEditFileModal(file);
        else if (del) {
          if (window.confirm("删除「" + file.name + "」？")) {
            deleteFiles([fid]);
            showToast("已删除");
            refreshMain();
          }
        }
      });

    $("res-select-all") &&
      $("res-select-all").addEventListener("change", function () {
        var on = $("res-select-all").checked;
        getFilteredFiles().forEach(function (f) {
          selectedFileIds[f.id] = on;
        });
        renderTable();
      });

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-res-close]")) closeModal();
    });
    $("res-modal") &&
      $("res-modal").addEventListener("click", function (e) {
        if (e.target === $("res-modal")) closeModal();
      });
    $("res-preview-backdrop") &&
      $("res-preview-backdrop").addEventListener("click", function (e) {
        if (e.target === $("res-preview-backdrop")) closePreview();
      });
    $("res-preview-close") &&
      $("res-preview-close").addEventListener("click", closePreview);
    $("res-preview-close-foot") &&
      $("res-preview-close-foot").addEventListener("click", closePreview);

    $("res-modal") &&
      $("res-modal").addEventListener("click", function (e) {
        if (e.target.closest(".admin-modal-close")) closeModal();
      });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if ($("res-preview-backdrop") && !$("res-preview-backdrop").hidden) closePreview();
      else if ($("res-modal") && !$("res-modal").hidden) closeModal();
    });
  }

  function init() {
    if (!$("res-tree-root")) return;
    seedData();
    bind();
    refreshAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
