-- ======================================================
-- 合江汉代画像石棺数字化保护与展示利用项目
-- Demo 演示数据初始化脚本（在基础库初始化 / migrate 之后执行）
-- 版本: v1.0
-- 创建日期: 2026-05-22
--
-- 说明: 推荐使用 `npx prisma db seed`（prisma/seed.ts）生成完整演示数据（含图片、模型、全景、公告等）。
--       本脚本仅提供最小化的 SQL 演示数据，崖墓乡镇/地址/简介、图片与模型记录不在此脚本内。
--
-- 前置条件:
--   1. 已执行 数据库初始化脚本.sql 或 npx prisma migrate deploy
--   2. 字典、geo_town 等基础数据已存在
--
-- 默认账号（密码均为 admin，bcrypt）:
--   admin / admin
--   zhangsan / admin
--   lisi / admin（已禁用）
-- ======================================================

USE han_coffin_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 清空演示相关表（保留 geo_town、sys_dict）
DELETE FROM `log_operation`;
DELETE FROM `log_login`;
DELETE FROM `biz_coffin_image`;
DELETE FROM `biz_coffin_model`;
DELETE FROM `biz_coffin`;
DELETE FROM `biz_entrance`;
DELETE FROM `biz_cliff_image`;
DELETE FROM `biz_cliff`;
DELETE FROM `biz_panorama_hotspot`;
DELETE FROM `biz_panorama_viewpoint`;
DELETE FROM `biz_panorama`;
DELETE FROM `biz_resource`;
DELETE FROM `sys_notice`;
DELETE FROM `sys_role_menu`;
DELETE FROM `sys_post_permission`;
DELETE FROM `sys_user_post`;
DELETE FROM `sys_user_role`;
DELETE FROM `sys_user`;
DELETE FROM `sys_menu`;
DELETE FROM `sys_post`;
DELETE FROM `sys_role`;
DELETE FROM `sys_dept`;

SET FOREIGN_KEY_CHECKS = 1;

-- bcrypt('admin', 10)
SET @pwd = '$2b$10$89dwgzqL06x029G9d3Z2/O3EDZLfhaF7f1GMJ4CAUHQmIKjP77Pey';

-- ======================================================
-- 组织与权限
-- ======================================================

INSERT INTO `sys_dept` (`id`, `name`, `parent_id`, `sort`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, '合江崖墓数字化项目组', NULL, 1, 1, 0, NOW(3), NOW(3)),
(2, '博物馆', 1, 1, 1, 0, NOW(3), NOW(3)),
(3, '信息中心', 2, 1, 1, 0, NOW(3), NOW(3)),
(4, '展教部', 2, 2, 1, 0, NOW(3), NOW(3));

INSERT INTO `sys_role` (`id`, `name`, `code`, `type`, `data_scope`, `sort`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, '系统管理员', 'SYS_ADMIN', 1, 'all', 1, 1, 0, NOW(3), NOW(3)),
(2, '业务管理员', 'BIZ_ADMIN', 1, 'dept', 2, 1, 0, NOW(3), NOW(3)),
(3, '内容编辑', 'EDITOR', 1, 'dept', 3, 1, 0, NOW(3), NOW(3)),
(4, '访客角色', 'GUEST', 1, 'all', 4, 1, 0, NOW(3), NOW(3));

INSERT INTO `sys_post` (`id`, `name`, `code`, `parent_id`, `sort`, `remark`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, '馆长', 'director', NULL, 1, '全面负责', 1, 0, NOW(3), NOW(3)),
(2, '副馆长', 'vice_director', 1, 2, '协管业务', 1, 0, NOW(3), NOW(3)),
(3, '展教专员', 'edu_staff', 2, 3, '展陈与讲解', 1, 0, NOW(3), NOW(3));

INSERT INTO `sys_menu` (`id`, `name`, `icon`, `parent_id`, `path`, `component`, `sort`, `type`, `perms`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, '工作台', 'guide', NULL, NULL, NULL, 0, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(2, '首页概览', 'dashboard', 1, '/admin/dashboard', 'dashboard/index', 0, 'menu', 'dashboard:list', 1, 0, NOW(3), NOW(3)),
(3, '业务数据', 'cascader', NULL, NULL, NULL, 1, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(4, '崖墓管理', 'tree', 3, '/admin/cliff', 'cliff/index', 0, 'menu', 'cliff:list', 1, 0, NOW(3), NOW(3)),
(5, '石棺管理', 'component', 3, '/admin/coffin', 'coffin/index', 1, 'menu', 'coffin:list', 1, 0, NOW(3), NOW(3)),
(6, '博物馆全景管理', 'camera', 3, '/admin/panorama', 'museum/index', 2, 'menu', 'panorama:list', 1, 0, NOW(3), NOW(3)),
(7, '资源管理', 'documentation', 3, '/admin/resource', 'resource/index', 3, 'menu', 'resource:list', 1, 0, NOW(3), NOW(3)),
(8, '组织与权限', 'peoples', NULL, NULL, NULL, 2, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(9, '用户管理', 'user', 8, '/admin/user', 'system/user/index', 0, 'menu', 'system:user:list', 1, 0, NOW(3), NOW(3)),
(10, '角色管理', 'lock', 8, '/admin/role', 'system/role/index', 1, 'menu', 'system:role:list', 1, 0, NOW(3), NOW(3)),
(11, '部门管理', 'tree-table', 8, '/admin/dept', 'system/dept/index', 2, 'menu', 'system:dept:list', 1, 0, NOW(3), NOW(3)),
(12, '岗位管理', 'postcard', 8, '/admin/post', 'system/post/index', 3, 'menu', 'system:post:list', 1, 0, NOW(3), NOW(3)),
(13, '日志与在线', 'log', NULL, NULL, NULL, 3, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(14, '操作日志', 'form', 13, '/admin/log-operation', 'monitor/operlog/index', 0, 'menu', 'monitor:operlog:list', 1, 0, NOW(3), NOW(3)),
(15, '登录日志', 'logininfor', 13, '/admin/log-login', 'monitor/logininfor/index', 1, 'menu', 'monitor:logininfor:list', 1, 0, NOW(3), NOW(3)),
(16, '在线用户', 'online', 13, '/admin/online-user', 'monitor/online/index', 2, 'menu', 'monitor:online:list', 1, 0, NOW(3), NOW(3)),
(17, '运维监控', 'server', NULL, NULL, NULL, 4, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(18, '服务监控', 'monitor', 17, '/admin/monitor-jvm', 'monitor/server/index', 0, 'menu', 'monitor:server:list', 1, 0, NOW(3), NOW(3)),
(19, '缓存监控', 'redis', 17, '/admin/monitor-redis', 'monitor/cache/index', 1, 'menu', 'monitor:cache:list', 1, 0, NOW(3), NOW(3)),
(20, '系统配置', 'system', NULL, NULL, NULL, 5, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(21, '菜单管理', 'tree-table', 20, '/admin/menu', 'system/menu/index', 0, 'menu', 'system:menu:list', 1, 0, NOW(3), NOW(3)),
(22, '通知公告', 'message', 20, '/admin/notice', 'system/notice/index', 1, 'menu', 'system:notice:list', 1, 0, NOW(3), NOW(3)),
(23, '账户', 'user', NULL, NULL, NULL, 6, 'dir', NULL, 1, 0, NOW(3), NOW(3)),
(24, '个人信息', 'people', 23, '/admin/profile', 'system/profile/index', 0, 'menu', 'system:profile:view', 1, 0, NOW(3), NOW(3));

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 1, `id` FROM `sys_menu`;

INSERT INTO `sys_user` (`id`, `account`, `password`, `name`, `phone`, `dept_id`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, 'admin', @pwd, '系统管理员', '13800000001', 3, 1, 0, NOW(3), NOW(3)),
(2, 'zhangsan', @pwd, '张三', '13800000002', 4, 1, 0, NOW(3), NOW(3)),
(3, 'lisi', @pwd, '李四', '13800000003', 2, 0, 0, NOW(3), NOW(3));

INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 3),
(3, 2),
(3, 4);

INSERT INTO `sys_user_post` (`user_id`, `post_id`) VALUES
(1, 1),
(2, 3),
(3, 2);

INSERT INTO `sys_post_permission` (`post_id`, `permission_id`) VALUES
(1, 'm1'), (1, 'm2'), (1, 'm3'), (1, 'm4'), (1, 'm5'),
(2, 'm2'), (2, 'm3'), (2, 'm4'),
(3, 'm3'), (3, 'm5');

-- ======================================================
-- 崖墓与墓口
-- ======================================================

INSERT INTO `biz_cliff` (`id`, `code`, `name`, `lng`, `lat`, `area`, `level`, `category`, `dynasty`, `description`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, 'CM-01', '洞溪崖墓群', NULL, NULL, NULL, 'county', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(2, 'CM-02', '黄溪侯五墙崖墓群', NULL, NULL, NULL, 'county', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(3, 'CM-03', '芭蕉湾崖墓群', NULL, NULL, NULL, 'city', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(4, 'CM-04', '蒋湾和幸福崖墓群', NULL, NULL, NULL, 'city', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(5, 'CM-05', '大耳朵崖墓群', 105.83458, 28.82576, 296, 'national', 'ordinary', '东汉', '<p>大耳朵崖墓群分布于红砂岩崖壁，为东汉时期崖洞式墓葬。2013 年公布为全国重点文物保护单位。</p>', 1, 0, NOW(3), NOW(3)),
(6, 'CM-06', '魏家祠崖墓群', NULL, NULL, NULL, 'provincial', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(7, 'CM-07', '观音岩崖墓群', NULL, NULL, NULL, 'city', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(8, 'CM-08', '渔链子崖墓群', NULL, NULL, NULL, 'city', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(9, 'CM-09', '大路边崖墓群', NULL, NULL, NULL, 'county', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(10, 'CM-10', '佛子岩崖墓群', NULL, NULL, NULL, 'county', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(11, 'CM-11', '鱼天堂崖墓群', NULL, NULL, NULL, 'provincial', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(12, 'CM-12', '高村崖墓群', NULL, NULL, NULL, 'county', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3)),
(13, 'CM-13', '梭滩石崖墓群', NULL, NULL, NULL, 'county', 'ordinary', '东汉', NULL, 1, 0, NOW(3), NOW(3));

INSERT INTO `biz_entrance` (`cliff_id`, `direction`, `intro`, `create_time`) VALUES
(5, 'M1', '墓口1，保存完好', NOW(3)),
(5, 'M2', '墓口2，保存完好', NOW(3)),
(5, 'M3', '墓口3，局部损坏', NOW(3)),
(5, 'M4', '墓口4，保存完好', NOW(3)),
(5, 'M5', '墓口5，已修复', NOW(3)),
(5, 'M6', '墓口6，保存完好', NOW(3));

-- ======================================================
-- 石棺（28 条，关联大耳朵崖墓群 id=5）
-- ======================================================

INSERT INTO `biz_coffin` (`id`, `code`, `name`, `cliff_id`, `dynasty`, `grade`, `source`, `completeness`, `dimensions`, `texture`, `description`, `thumbnail`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, 'CF-01', '1号棺（东汉羿求药图画像石棺）', 5, 'han', 'first', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '1号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(2, 'CF-02', '2号棺（东汉伏羲女娲图画像石棺）', 5, 'han', 'first', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '2号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(3, 'CF-03', '3号棺（东汉双阙迎宾画像石棺）', 5, 'han', 'first', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '3号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(4, 'CF-04', '4号棺（东汉车临天门画像石棺）', 5, 'han', 'first', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '4号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(5, 'CF-05', '5号棺（东汉车马巡行画像石棺）', 5, 'han', 'first', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '5号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(6, 'CF-06', '6号棺（东汉宴乐百戏画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '6号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(7, 'CF-07', '7号棺（东汉神农采药画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '7号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(8, 'CF-08', '8号棺（东汉东王公西王母画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '8号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(9, 'CF-09', '9号棺（东汉青龙白虎画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '9号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(10, 'CF-10', '10号棺（东汉夫妻宴享图画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '10号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(11, 'CF-11', '11号棺（东汉庖厨酿酒画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '11号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(12, 'CF-12', '12号棺（东汉乐舞杂技画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '12号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(13, 'CF-13', '13号棺（东汉狩猎图画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '13号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(14, 'CF-14', '14号棺（东汉楼阁人物画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '14号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(15, 'CF-15', '15号棺（东汉仙境图画像石棺）', 5, 'han', 'second', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '15号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(16, 'CF-16', '16号棺（东汉四神画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '16号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(17, 'CF-17', '17号棺（东汉门吏铺首画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '17号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(18, 'CF-18', '18号棺（东汉瑞兽祥禽画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '18号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(19, 'CF-19', '19号棺（东汉升仙图画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '19号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(20, 'CF-20', '32号棺（东汉燕居画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '32号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(21, 'CF-21', '33号棺（牛郎织女·七星北斗画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '33号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(22, 'CF-22', '22号棺（东汉武库兵器画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '22号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(23, 'CF-23', '23号棺（东汉求药图画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '23号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(24, 'CF-24', '24号棺（东汉龟鹤延年画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '24号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(25, 'CF-25', '25号棺（东汉五君子戏虎画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '25号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(26, 'CF-26', '26号棺（东汉五君子戏虎画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '26号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(27, 'CF-27', '27号棺（东汉西王母炼丹画像石棺）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '27号棺，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(28, 'CF-28', '棺盖（东汉莲蓬·柿蒂纹·钱币纹棺盖）', 5, 'han', 'third', 'excavation', 'complete', '长210cm，宽75cm，高85cm', '红砂岩', '棺盖，1987年大耳朵崖墓群出土。', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3));

INSERT INTO `biz_coffin_image` (`coffin_id`, `image_url`, `image_type`, `sort`, `create_time`) VALUES
(1, '/prototype/assets/pano-museum-indoor-hall.png', 'ortho', 0, NOW(3)),
(1, '/prototype/assets/pano-museum-indoor-coffin.png', 'rubbing', 1, NOW(3)),
(1, '/prototype/assets/pano-museum-indoor-hall.png', 'line', 2, NOW(3)),
(1, '/prototype/assets/pano-museum-indoor-coffin.png', 'enhance', 3, NOW(3)),
(2, '/prototype/assets/pano-museum-indoor-coffin.png', 'ortho', 0, NOW(3)),
(2, '/prototype/assets/pano-museum-indoor-hall.png', 'rubbing', 1, NOW(3)),
(2, '/prototype/assets/pano-museum-indoor-coffin.png', 'line', 2, NOW(3)),
(2, '/prototype/assets/pano-museum-indoor-hall.png', 'enhance', 3, NOW(3)),
(3, '/prototype/assets/pano-museum-indoor-hall.png', 'ortho', 0, NOW(3)),
(3, '/prototype/assets/pano-museum-indoor-coffin.png', 'rubbing', 1, NOW(3)),
(3, '/prototype/assets/pano-museum-indoor-hall.png', 'line', 2, NOW(3)),
(3, '/prototype/assets/pano-museum-indoor-coffin.png', 'enhance', 3, NOW(3));

INSERT INTO `biz_coffin_model` (`coffin_id`, `model_url`, `format`, `file_size`, `create_time`) VALUES
(1, 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', 'glb', 5242880, NOW(3)),
(2, 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', 'glb', 5242880, NOW(3)),
(3, 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', 'glb', 5242880, NOW(3));

-- ======================================================
-- 全景、资源、公告
-- ======================================================

INSERT INTO `biz_panorama` (`id`, `name`, `category`, `image_url`, `status`, `del_flag`, `create_time`, `update_time`) VALUES
(1, '博物馆大厅', 'inner', '/prototype/assets/pano-museum-indoor-hall.png', 1, 0, NOW(3), NOW(3)),
(2, '石棺展厅', 'inner', '/prototype/assets/pano-museum-indoor-coffin.png', 1, 0, NOW(3), NOW(3)),
(3, '大耳朵崖墓群外景', 'ground', '/prototype/assets/hejiang-han-cliff-distribution.png', 1, 0, NOW(3), NOW(3)),
(4, '墓口内部全景', 'inner', '/prototype/assets/pano-museum-indoor-coffin.png', 0, 0, NOW(3), NOW(3)),
(5, '航拍全景', 'air', '/prototype/assets/hejiang-han-cliff-distribution.png', 1, 0, NOW(3), NOW(3));

INSERT INTO `biz_resource` (`id`, `name`, `type`, `parent_id`, `file_url`, `file_size`, `del_flag`, `create_time`, `update_time`) VALUES
(1, '崖墓数字化成果', 'folder', NULL, NULL, 0, 0, NOW(3), NOW(3)),
(2, '大耳朵崖墓群', 'folder', 1, NULL, 0, 0, NOW(3), NOW(3)),
(3, '分布图.png', 'image', 2, '/prototype/assets/hejiang-han-cliff-distribution.png', 2048000, 0, NOW(3), NOW(3)),
(4, '石棺三维模型', 'folder', NULL, NULL, 0, 0, NOW(3), NOW(3)),
(5, 'coffin_m1.glb', 'model', 4, 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', 5242880, 0, NOW(3), NOW(3)),
(6, 'coffin_m2.glb', 'model', 4, 'https://modelviewer.dev/shared-assets/models/Horse.glb', 4194304, 0, NOW(3), NOW(3)),
(7, '扫描与点云', 'folder', NULL, NULL, 0, 0, NOW(3), NOW(3)),
(8, 'M3墓口点云.las', 'pointcloud', 7, NULL, 104857600, 0, NOW(3), NOW(3));

INSERT INTO `sys_notice` (`id`, `title`, `content`, `content_html`, `type`, `scope`, `status`, `published_at`, `create_by`, `create_time`, `update_time`) VALUES
(1, '系统维护通知', '计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。', '<p>计划于周末进行数据库备份，期间可能出现短暂卡顿，请提前保存工作。</p>', 'notice', 'all', 'published', '2026-05-22', 'admin', NOW(3), NOW(3)),
(2, '内部培训（草稿）', '新员工平台使用培训，时间待定。', '<p>新员工平台使用培训，时间待定。</p>', 'notice', 'all', 'draft', 'admin', NULL, NOW(3), NOW(3));

-- ======================================================
-- 日志
-- ======================================================

INSERT INTO `log_operation` (`operator`, `operate_time`, `type`, `description`, `method`, `url`, `status`, `ip`) VALUES
('系统管理员', '2026-04-07 09:05:00', '编辑', '更新「大耳朵崖墓群」台账', 'PUT', '/api/v1/cliffs/5', 1, '10.0.0.12'),
('张三', '2026-04-07 09:18:00', '上传', '模型文件 coffin_m2.glb', 'POST', '/api/v1/coffins/2/resources', 1, '10.0.0.15'),
('系统管理员', '2026-04-07 09:42:00', '新增', '新增用户：王五', 'POST', '/api/v1/users', 1, '10.0.0.12'),
('李四', '2026-04-07 10:15:00', '查看', '查看崖墓详情', 'GET', '/api/v1/cliffs/5', 1, '10.0.0.18'),
('系统管理员', '2026-04-07 11:02:00', '删除', '删除过期通知公告', 'DELETE', '/api/v1/notices/3', 1, '10.0.0.12'),
('李四', '2026-04-07 10:01:00', '删除', '删除文件夹「临时扫描」', 'DELETE', '/api/v1/resources/99', 1, '192.168.1.88'),
('系统管理员', '2026-04-06 16:30:00', '编辑', '调整角色「内容编辑」权限', 'PUT', '/api/v1/roles/3', 1, '10.0.0.12'),
('张三', '2026-04-06 14:20:00', '查看', '打开全景配置', 'GET', '/api/v1/panoramas/2', 1, '10.0.0.15'),
('王五', '2026-04-05 11:00:00', '发布', '发布「清明开放公告」', 'POST', '/api/v1/notices', 1, '192.168.2.3'),
('系统管理员', '2026-04-04 09:00:00', '编辑', '调整侧栏菜单排序', 'PUT', '/api/v1/menus/3', 1, '10.0.0.12');

INSERT INTO `log_login` (`username`, `login_time`, `ip`, `os`, `browser`, `success`, `fail_reason`) VALUES
('admin', '2026-04-07 08:58:00', '10.0.0.12', 'Windows 11', 'Chrome 131', 1, NULL),
('zhangsan', '2026-04-07 09:02:00', '10.0.0.15', 'Windows 11', 'Edge 130', 1, NULL),
('guest', '2026-04-07 08:50:00', '192.168.1.20', 'Windows 10', 'Chrome 130', 0, '密码错误'),
('lisi', '2026-04-06 18:00:00', '192.168.1.88', 'macOS 14', 'Safari 17', 1, NULL),
('unknown', '2026-04-05 22:01:00', '198.51.100.2', 'Linux', 'curl', 0, '账号不存在'),
('admin', '2026-04-06 09:10:00', '10.0.0.12', 'Windows 11', 'Chrome 131', 1, NULL),
('wangwu', '2026-04-05 14:30:00', '192.168.2.3', 'Android 14', 'Chrome Mobile', 1, NULL),
('admin', '2026-04-04 07:00:00', '10.0.0.12', 'Windows 11', 'Chrome 131', 1, NULL);

-- ======================================================
SELECT 'Demo 数据初始化完成' AS result;
SELECT 'biz_cliff' AS tbl, COUNT(*) AS cnt FROM biz_cliff
UNION ALL SELECT 'biz_coffin', COUNT(*) FROM biz_coffin
UNION ALL SELECT 'sys_user', COUNT(*) FROM sys_user
UNION ALL SELECT 'log_operation', COUNT(*) FROM log_operation;
