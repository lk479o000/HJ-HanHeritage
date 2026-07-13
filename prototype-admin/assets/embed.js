/* 内嵌 iframe 时隐藏子页自带侧栏/顶栏 */
(function () {
  if (new URLSearchParams(window.location.search).get("embed") === "1") {
    document.documentElement.classList.add("embed-mode");
  }
})();
