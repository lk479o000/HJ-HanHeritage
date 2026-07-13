/**
 * 首页地图标点：跳转崖墓专属页面（cliff-detail.html?cliff=n）
 */
(function () {
  "use strict";

  var data = window.CLIFF_MARKERS_13 || [];
  var wrap = document.getElementById("map-markers");
  if (!wrap || !data.length) return;

  data.forEach(function (row) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-marker" + (row.featured ? " map-marker--featured" : "");
    btn.style.left = row.left + "%";
    btn.style.top = row.top + "%";
    btn.setAttribute("aria-label", row.name + "，打开详情");
    btn.innerHTML =
      '<span class="map-marker-code">' +
      String(row.id).padStart(2, "0") +
      "</span>" +
      '<span class="map-marker-label" aria-hidden="true">' +
      escapeHtml(row.name) +
      "</span>";
    btn.addEventListener("click", function () {
      window.location.href = "cliff-detail.html?cliff=" + row.id;
    });
    wrap.appendChild(btn);
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }
})();
