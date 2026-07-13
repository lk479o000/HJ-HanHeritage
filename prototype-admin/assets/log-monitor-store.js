/**
 * 操作日志、登录日志、在线用户（原型内存，可扩展 append*）
 */
(function () {
  "use strict";
  if (window.LogMonitorStore) return;

  function dayMs(y, m, d, hh, mm) {
    return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).getTime();
  }

  var opId = 1;
  var loginId = 1;
  var onlineId = 1;

  function op(id, at, userDisplay, module, action, detail, ip) {
    return { id: "op" + id, at: at, userDisplay: userDisplay, module: module, action: action, detail: detail || "", ip: ip || "" };
  }

  function lg(id, at, account, ip, ok, message) {
    return { id: "lg" + id, at: at, account: account, ip: ip, ok: ok, message: message || "" };
  }

  window.LogMonitorStore = {
    operationLogs: [
      op(opId++, dayMs(2026, 4, 7, 9, 5), "系统管理员", "崖墓管理", "编辑", "更新「大耳朵崖墓群」台账", "10.0.0.12"),
      op(opId++, dayMs(2026, 4, 7, 9, 18), "张三", "石棺管理", "上传", "模型文件 coffin_m2.glb", "10.0.0.15"),
      op(opId++, dayMs(2026, 4, 7, 9, 42), "系统管理员", "用户管理", "新增", "新增用户：王五", "10.0.0.12"),
      op(opId++, dayMs(2026, 4, 7, 10, 1), "李四", "资源管理", "删除", "删除文件夹「临时扫描」", "192.168.1.88"),
      op(opId++, dayMs(2026, 4, 6, 16, 30), "系统管理员", "角色管理", "编辑", "调整角色「内容编辑」权限", "10.0.0.12"),
      op(opId++, dayMs(2026, 4, 6, 14, 20), "张三", "崖墓管理", "查看", "打开全景配置", "10.0.0.15"),
      op(opId++, dayMs(2026, 4, 5, 11, 0), "王五", "通知公告", "发布", "发布「清明开放公告」", "192.168.2.3"),
      op(opId++, dayMs(2026, 4, 4, 9, 0), "系统管理员", "部门管理", "新增", "新增部门「文保中心」", "10.0.0.12"),
      op(opId++, dayMs(2026, 4, 3, 17, 45), "访客账号", "石棺管理", "导出", "导出资源清单 CSV", "203.0.113.9"),
      op(opId++, dayMs(2026, 4, 2, 8, 55), "系统管理员", "菜单管理", "编辑", "调整侧栏菜单排序", "10.0.0.12"),
    ],
    loginLogs: [
      lg(loginId++, dayMs(2026, 4, 7, 8, 58), "系统管理员", "10.0.0.12", true, "登录成功"),
      lg(loginId++, dayMs(2026, 4, 7, 9, 2), "张三", "10.0.0.15", true, "登录成功"),
      lg(loginId++, dayMs(2026, 4, 7, 8, 50), "guest", "192.168.1.20", false, "密码错误"),
      lg(loginId++, dayMs(2026, 4, 6, 18, 0), "李四", "192.168.1.88", true, "登录成功"),
      lg(loginId++, dayMs(2026, 4, 6, 9, 10), "业务管理员", "10.0.0.12", true, "登录成功"),
      lg(loginId++, dayMs(2026, 4, 5, 22, 1), "unknown", "198.51.100.2", false, "账号不存在"),
      lg(loginId++, dayMs(2026, 4, 5, 14, 30), "王五", "192.168.2.3", true, "登录成功"),
      lg(loginId++, dayMs(2026, 4, 4, 7, 0), "系统管理员", "10.0.0.12", true, "登录成功"),
    ],
    onlineUsers: [
      { id: "on" + onlineId++, name: "系统管理员", dept: "信息中心", loginAt: dayMs(2026, 4, 7, 8, 58), ip: "10.0.0.12", client: "Chrome 131 / Windows" },
      { id: "on" + onlineId++, name: "张三", dept: "展教部", loginAt: dayMs(2026, 4, 7, 9, 2), ip: "10.0.0.15", client: "Edge 130 / Windows" },
      { id: "on" + onlineId++, name: "李四", dept: "博物馆", loginAt: dayMs(2026, 4, 6, 18, 0), ip: "192.168.1.88", client: "Safari / macOS" },
      { id: "on" + onlineId++, name: "王五", dept: "文保中心", loginAt: dayMs(2026, 4, 5, 14, 30), ip: "192.168.2.3", client: "Chrome / Android" },
    ],
    _counters: { op: opId, login: loginId, online: onlineId },

    appendOperation: function (entry) {
      var c = this._counters.op++;
      var row = {
        id: "op" + c,
        at: entry.at != null ? entry.at : Date.now(),
        userDisplay: String(entry.userDisplay || "—"),
        module: String(entry.module || "—"),
        action: String(entry.action || "—"),
        detail: String(entry.detail || ""),
        ip: String(entry.ip || ""),
      };
      this.operationLogs.unshift(row);
      return row;
    },

    appendLogin: function (entry) {
      var c = this._counters.login++;
      var row = {
        id: "lg" + c,
        at: entry.at != null ? entry.at : Date.now(),
        account: String(entry.account || "—"),
        ip: String(entry.ip || ""),
        ok: !!entry.ok,
        message: String(entry.message || ""),
      };
      this.loginLogs.unshift(row);
      return row;
    },
  };
})();
