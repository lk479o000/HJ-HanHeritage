/**
 * 个人信息：基本资料保存；修改密码（原型校验）
 */
(function () {
  "use strict";

  var U = window.OrgAdminUI;
  var $ = U.$;
  var Store = window.SysConfigStore;

  function fill() {
    if (!Store) return;
    var p = Store.getProfile();
    $("pf-account") && ($("pf-account").textContent = p.account || "—");
    $("pf-dept") && ($("pf-dept").textContent = p.dept || "—");
    $("pf-roles") && ($("pf-roles").textContent = p.roles || "—");
    $("pf-created") && ($("pf-created").textContent = p.createdAt || "—");
    $("pf-display") && ($("pf-display").value = p.displayName || "");
    $("pf-phone") && ($("pf-phone").value = p.phone || "");
    $("pf-email") && ($("pf-email").value = p.email || "");
    $("pf-nick") && ($("pf-nick").textContent = p.displayName || p.account || "—");
    $("pf-phone-ro") && ($("pf-phone-ro").textContent = p.phone || "—");
    $("pf-email-ro") && ($("pf-email-ro").textContent = p.email || "—");
  }

  function saveProfile() {
    if (!Store) return;
    Store.updateProfile({
      displayName: ($("pf-display") && $("pf-display").value) || "",
      phone: ($("pf-phone") && $("pf-phone").value) || "",
      email: ($("pf-email") && $("pf-email").value) || "",
    });
    U.showToast("profile-toast", "资料已保存");
    tryRefreshShellTopbar();
  }

  function tryRefreshShellTopbar() {
    try {
      if (window.parent && window.parent !== window && window.parent.AdminLayout && window.parent.AdminLayout.refreshShellNavigation) {
        window.parent.AdminLayout.refreshShellNavigation();
      }
    } catch (e) {}
  }

  function changePassword() {
    var cur = ($("pf-pwd-cur") && $("pf-pwd-cur").value) || "";
    var n1 = ($("pf-pwd-new") && $("pf-pwd-new").value) || "";
    var n2 = ($("pf-pwd-new2") && $("pf-pwd-new2").value) || "";
    if (!cur) {
      U.showToast("profile-toast", "请填写当前密码");
      return;
    }
    if (n1.length < 6) {
      U.showToast("profile-toast", "新密码至少 6 位（原型规则）");
      return;
    }
    if (n1 !== n2) {
      U.showToast("profile-toast", "两次新密码不一致");
      return;
    }
    if ($("pf-pwd-cur")) $("pf-pwd-cur").value = "";
    if ($("pf-pwd-new")) $("pf-pwd-new").value = "";
    if ($("pf-pwd-new2")) $("pf-pwd-new2").value = "";
    U.showToast("profile-toast", "密码已更新（原型，未接服务端）");
  }

  function init() {
    fill();
    $("pf-save") && $("pf-save").addEventListener("click", saveProfile);
    $("pf-pwd-save") && $("pf-pwd-save").addEventListener("click", changePassword);
    $("pf-cancel") &&
      $("pf-cancel").addEventListener("click", function () {
        if (window.history && window.history.length > 1) window.history.back();
        else window.location.href = "index.html";
      });

    var tBase = $("tab-base");
    var tPwd = $("tab-pwd");
    var pBase = $("panel-base");
    var pPwd = $("panel-pwd");
    function setTab(which) {
      if (!tBase || !tPwd || !pBase || !pPwd) return;
      var isBase = which === "base";
      tBase.classList.toggle("is-active", isBase);
      tPwd.classList.toggle("is-active", !isBase);
      tBase.setAttribute("aria-selected", isBase ? "true" : "false");
      tPwd.setAttribute("aria-selected", !isBase ? "true" : "false");
      pBase.hidden = !isBase;
      pPwd.hidden = isBase;
    }
    tBase && tBase.addEventListener("click", function () { setTab("base"); });
    tPwd && tPwd.addEventListener("click", function () { setTab("pwd"); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
