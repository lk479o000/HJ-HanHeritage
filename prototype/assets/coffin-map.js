/**
 * 石棺分布模拟地图：28 个模拟标点，点击进入石棺详情。
 */
(function () {
  "use strict";

  var wrap = document.getElementById("coffin-map-markers");
  if (!wrap) return;

  var points = buildMockPoints(28);
  points.forEach(function (p) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "coffin-marker";
    btn.style.left = p.left + "%";
    btn.style.top = p.top + "%";
    btn.setAttribute("aria-label", "石棺 " + pad2(p.id) + "，打开详情");
    btn.innerHTML = '<span class="coffin-marker-code">' + pad2(p.id) + "</span>";
    btn.addEventListener("click", function () {
      window.location.href = "coffin.html?coffin=" + p.id;
    });
    wrap.appendChild(btn);
  });

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function buildMockPoints(total) {
    // 通过 4 个簇生成模拟分布，后续可替换为真实坐标。
    var clusters = [
      { left: 34, top: 30, dx: 4.2, dy: 3.2 },
      { left: 49, top: 44, dx: 4.5, dy: 3.4 },
      { left: 63, top: 34, dx: 3.8, dy: 2.9 },
      { left: 56, top: 57, dx: 4.0, dy: 3.0 }
    ];
    var out = [];
    for (var i = 1; i <= total; i++) {
      var c = clusters[(i - 1) % clusters.length];
      var ring = Math.floor((i - 1) / clusters.length);
      var angle = ((i * 37) % 360) * Math.PI / 180;
      var radiusX = c.dx * (1 + (ring % 3) * 0.55);
      var radiusY = c.dy * (1 + (ring % 3) * 0.55);
      out.push({
        id: i,
        left: clamp(c.left + Math.cos(angle) * radiusX, 8, 92),
        top: clamp(c.top + Math.sin(angle) * radiusY, 10, 84)
      });
    }
    return out;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
})();
