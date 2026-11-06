-- ======================================================
-- 合江汉代画像石棺数字化保护与展示利用项目
-- 数据库初始化脚本
-- 版本: v1.0
-- 创建日期: 2026-05-22
-- ======================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS han_coffin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE han_coffin_db;

-- ======================================================
-- 地理基础数据表
-- ======================================================

CREATE TABLE IF NOT EXISTS `geo_town` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(20) NOT NULL COMMENT '乡镇编码',
  `name` VARCHAR(50) NOT NULL COMMENT '乡镇名称',
  `full_name` VARCHAR(100) NOT NULL COMMENT '完整名称（含县区）',
  `lng` DECIMAL(10,5) NULL COMMENT '中心经度（WGS-84）',
  `lat` DECIMAL(10,5) NULL COMMENT '中心纬度（WGS-84）',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `remark` VARCHAR(200) NULL COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_name` (`name`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合江县乡镇基础数据表';

-- 合江县22个乡镇数据
INSERT INTO `geo_town` (`code`, `name`, `full_name`, `lng`, `lat`, `sort`, `status`) VALUES
('HJ-01', '符阳街道', '合江县符阳街道', 105.78300, 28.78500, 1, 1),
('HJ-02', '临港街道', '合江县临港街道', 105.83458, 28.82576, 2, 1),
('HJ-03', '神臂城镇', '合江县神臂城镇', 105.62000, 28.75000, 3, 1),
('HJ-04', '白沙镇', '合江县白沙镇', 105.68000, 28.85000, 4, 1),
('HJ-05', '望龙镇', '合江县望龙镇', 105.55000, 28.82000, 5, 1),
('HJ-06', '佛荫镇', '合江县佛荫镇', 105.68000, 28.68000, 6, 1),
('HJ-07', '尧坝镇', '合江县尧坝镇', 105.52000, 28.58000, 7, 1),
('HJ-08', '先市镇', '合江县先市镇', 105.72000, 28.58000, 8, 1),
('HJ-09', '九支镇', '合江县九支镇', 105.48000, 28.62000, 9, 1),
('HJ-10', '五通镇', '合江县五通镇', 105.42000, 28.55000, 10, 1),
('HJ-11', '凤鸣镇', '合江县凤鸣镇', 105.58000, 28.72000, 11, 1),
('HJ-12', '榕山镇', '合江县榕山镇', 105.80000, 28.68000, 12, 1),
('HJ-13', '白鹿镇', '合江县白鹿镇', 105.90000, 28.88000, 13, 1),
('HJ-14', '甘雨镇', '合江县甘雨镇', 105.88000, 28.65000, 14, 1),
('HJ-15', '福宝镇', '合江县福宝镇', 105.55000, 28.48000, 15, 1),
('HJ-16', '南滩镇', '合江县南滩镇', 105.60000, 28.92000, 16, 1),
('HJ-17', '石龙镇', '合江县石龙镇', 105.75000, 28.90000, 17, 1),
('HJ-18', '先滩镇', '合江县先滩镇', 105.48000, 28.45000, 18, 1),
('HJ-19', '真龙镇', '合江县真龙镇', 105.70000, 28.72000, 19, 1),
('HJ-20', '车辋镇', '合江县车辋镇', 105.48000, 28.70000, 20, 1),
('HJ-21', '虎头镇', '合江县虎头镇', 105.75000, 28.62000, 21, 1),
('HJ-22', '法王寺镇', '合江县法王寺镇', 105.50000, 28.52000, 22, 1);

-- ======================================================
-- 系统管理表
-- ======================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `account` VARCHAR(50) NOT NULL COMMENT '账号',
  `password` VARCHAR(200) NOT NULL COMMENT '密码',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `email` VARCHAR(100) NULL COMMENT '邮箱',
  `avatar` VARCHAR(500) NULL COMMENT '头像路径',
  `dept_id` BIGINT NULL COMMENT '部门ID',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记（0=正常，1=删除）',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_account` (`account`),
  INDEX `idx_dept_id` (`dept_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `code` VARCHAR(50) NOT NULL COMMENT '角色编码',
  `type` TINYINT DEFAULT 1 COMMENT '角色类型（1=系统角色，2=自定义角色）',
  `data_scope` VARCHAR(20) NULL COMMENT '数据范围（all=全部，dept=本部门，custom=自定义）',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父角色ID',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- 部门表
CREATE TABLE IF NOT EXISTS `sys_dept` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '部门名称',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父部门ID',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `leader` VARCHAR(50) NULL COMMENT '负责人',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统部门表';

-- 菜单表
CREATE TABLE IF NOT EXISTS `sys_menu` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '菜单名称',
  `icon` VARCHAR(100) NULL COMMENT '菜单图标',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父菜单ID',
  `path` VARCHAR(200) NULL COMMENT '路由路径',
  `component` VARCHAR(200) NULL COMMENT '组件路径',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `type` VARCHAR(10) NOT NULL COMMENT '菜单类型（M=菜单，C=按钮）',
  `perms` VARCHAR(100) NULL COMMENT '权限标识',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表';

-- 岗位表
CREATE TABLE IF NOT EXISTS `sys_post` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '岗位名称',
  `code` VARCHAR(50) NOT NULL COMMENT '岗位编码',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父岗位ID',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `remark` VARCHAR(200) NULL COMMENT '备注',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统岗位表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`, `role_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 用户岗位关联表
CREATE TABLE IF NOT EXISTS `sys_user_post` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `post_id` BIGINT NOT NULL COMMENT '岗位ID',
  PRIMARY KEY (`user_id`, `post_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_post_id` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户岗位关联表';

-- 角色菜单关联表
CREATE TABLE IF NOT EXISTS `sys_role_menu` (
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `menu_id` BIGINT NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (`role_id`, `menu_id`),
  INDEX `idx_role_id` (`role_id`),
  INDEX `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `sys_role_permission` (
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `permission_id` VARCHAR(50) NOT NULL COMMENT '权限标识',
  PRIMARY KEY (`role_id`, `permission_id`),
  INDEX `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 岗位权限关联表
CREATE TABLE IF NOT EXISTS `sys_post_permission` (
  `post_id` BIGINT NOT NULL COMMENT '岗位ID',
  `permission_id` VARCHAR(50) NOT NULL COMMENT '权限标识',
  PRIMARY KEY (`post_id`, `permission_id`),
  INDEX `idx_post_id` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位权限关联表';

-- 字典表
CREATE TABLE IF NOT EXISTS `sys_dict` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `dict_type` VARCHAR(50) NOT NULL COMMENT '字典类型',
  `dict_code` VARCHAR(50) NOT NULL COMMENT '字典编码',
  `dict_label` VARCHAR(100) NOT NULL COMMENT '字典标签（显示名称）',
  `dict_value` VARCHAR(100) NULL COMMENT '字典值（实际存储值）',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `status` TINYINT DEFAULT 1 COMMENT '状态（1=启用，0=禁用）',
  `remark` VARCHAR(200) NULL COMMENT '备注说明',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_type_code` (`dict_type`, `dict_code`),
  INDEX `idx_dict_type` (`dict_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统字典表';

-- 通知表
CREATE TABLE IF NOT EXISTS `sys_notice` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT NULL COMMENT '通知内容（纯文本）',
  `content_html` TEXT NULL COMMENT '通知内容（HTML）',
  `type` VARCHAR(20) NOT NULL COMMENT '通知类型',
  `scope` VARCHAR(20) NOT NULL COMMENT '发布范围',
  `status` VARCHAR(20) NOT NULL COMMENT '状态',
  `published_at` DATETIME NULL COMMENT '发布时间',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知表';

-- ======================================================
-- 业务数据表
-- ======================================================

-- 崖墓表
CREATE TABLE IF NOT EXISTS `biz_cliff` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(20) NOT NULL COMMENT '崖墓编号',
  `name` VARCHAR(100) NOT NULL COMMENT '崖墓名称',
  `lng` DECIMAL(10,5) NULL COMMENT '经度',
  `lat` DECIMAL(10,5) NULL COMMENT '纬度',
  `area` FLOAT NULL COMMENT '面积',
  `town` VARCHAR(50) NULL COMMENT '所属乡镇',
  `address` VARCHAR(200) NULL COMMENT '地址',
  `protection_unit_name` VARCHAR(150) NULL COMMENT '保护单位名称',
  `composition` VARCHAR(200) NULL COMMENT '构成',
  `level` VARCHAR(20) NULL COMMENT '保护级别',
  `category` VARCHAR(20) NULL COMMENT '墓葬类别',
  `dynasty` VARCHAR(20) NULL COMMENT '朝代',
  `description` TEXT NULL COMMENT '描述',
  `map_left` FLOAT NULL COMMENT '首页分布图横向百分比',
  `map_top` FLOAT NULL COMMENT '首页分布图纵向百分比',
  `featured` TINYINT DEFAULT 0 COMMENT '是否重点展示',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `cover_image` VARCHAR(500) NULL COMMENT '封面图',
  `model_url` VARCHAR(500) NULL COMMENT '三维模型地址',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='崖墓数据表';

-- 崖墓入口表
CREATE TABLE IF NOT EXISTS `biz_entrance` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `cliff_id` BIGINT NOT NULL COMMENT '崖墓ID',
  `x` FLOAT NULL COMMENT 'X坐标',
  `y` FLOAT NULL COMMENT 'Y坐标',
  `z` FLOAT NULL COMMENT 'Z坐标',
  `direction` VARCHAR(20) NULL COMMENT '朝向',
  `intro` VARCHAR(500) NULL COMMENT '简介',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_cliff_id` (`cliff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='崖墓入口数据表';

-- 崖墓图片表
CREATE TABLE IF NOT EXISTS `biz_cliff_image` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `cliff_id` BIGINT NOT NULL COMMENT '崖墓ID',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片路径',
  `image_type` VARCHAR(20) DEFAULT 'photo' COMMENT '图片类型',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_cliff_id` (`cliff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='崖墓图片表';

-- 棺椁表
CREATE TABLE IF NOT EXISTS `biz_coffin` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(20) NOT NULL COMMENT '棺椁编号',
  `name` VARCHAR(100) NOT NULL COMMENT '棺椁名称',
  `cliff_id` BIGINT NULL COMMENT '所属崖墓ID',
  `dynasty` VARCHAR(20) NULL COMMENT '朝代',
  `grade` VARCHAR(20) NULL COMMENT '文物级别',
  `source` VARCHAR(20) NULL COMMENT '来源',
  `completeness` VARCHAR(20) NULL COMMENT '完残程度',
  `dimensions` VARCHAR(100) NULL COMMENT '尺寸',
  `texture` VARCHAR(50) NULL COMMENT '质地',
  `description` TEXT NULL COMMENT '描述',
  `thumbnail` VARCHAR(500) NULL COMMENT '缩略图',
  `original_name` VARCHAR(150) NULL COMMENT '原名',
  `registry_type` VARCHAR(50) NULL COMMENT '登记类型',
  `tomb_group` VARCHAR(150) NULL COMMENT '墓葬群',
  `era_category` VARCHAR(50) NULL COMMENT '年代大类',
  `era_specific` VARCHAR(50) NULL COMMENT '具体年代',
  `artifact_category` VARCHAR(50) NULL COMMENT '文物类别',
  `material_category` VARCHAR(50) NULL COMMENT '质地大类',
  `material_specific` VARCHAR(100) NULL COMMENT '具体质地',
  `weight_range` VARCHAR(50) NULL COMMENT '重量范围',
  `weight_value` VARCHAR(50) NULL COMMENT '重量值',
  `weight_unit` VARCHAR(20) NULL COMMENT '重量单位',
  `source_detail` VARCHAR(200) NULL COMMENT '来源详情',
  `completeness_detail` VARCHAR(200) NULL COMMENT '完残详情',
  `preservation_status` VARCHAR(50) NULL COMMENT '保存状况',
  `accession_range` VARCHAR(50) NULL COMMENT '入藏范围',
  `accession_year` VARCHAR(20) NULL COMMENT '入藏年份',
  `quantity` INT DEFAULT 1 COMMENT '数量',
  `dim_text` VARCHAR(100) NULL COMMENT '尺寸文本',
  `map_left` FLOAT NULL COMMENT '导览图横向百分比',
  `map_top` FLOAT NULL COMMENT '导览图纵向百分比',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_cliff_id` (`cliff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='棺椁数据表';

-- 棺椁图片表
CREATE TABLE IF NOT EXISTS `biz_coffin_image` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `coffin_id` BIGINT NOT NULL COMMENT '棺椁ID',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片路径',
  `image_type` VARCHAR(20) NOT NULL COMMENT '图片类型',
  `sort` INT DEFAULT 0 COMMENT '排序号',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_coffin_id` (`coffin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='棺椁图片表';

-- 棺椁模型表
CREATE TABLE IF NOT EXISTS `biz_coffin_model` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `coffin_id` BIGINT NOT NULL COMMENT '棺椁ID',
  `model_url` VARCHAR(500) NOT NULL COMMENT '模型路径',
  `format` VARCHAR(20) NOT NULL COMMENT '模型格式',
  `file_size` INT DEFAULT 0 COMMENT '文件大小',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_coffin_id` (`coffin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='棺椁模型表';

-- 全景数据表
CREATE TABLE IF NOT EXISTS `biz_panorama` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '全景名称',
  `category` VARCHAR(20) NULL COMMENT '全景分类',
  `location` VARCHAR(200) NULL COMMENT '位置',
  `description` TEXT NULL COMMENT '描述',
  `image_url` VARCHAR(500) NULL COMMENT '全景图路径',
  `file_size` INT DEFAULT 0 COMMENT '文件大小（KB）',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全景数据表';

-- 全景视点表
CREATE TABLE IF NOT EXISTS `biz_panorama_viewpoint` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `panorama_id` BIGINT NOT NULL COMMENT '全景ID',
  `name` VARCHAR(100) NOT NULL COMMENT '视点名称',
  `lng` DECIMAL(10,5) NULL COMMENT '经度',
  `lat` DECIMAL(10,5) NULL COMMENT '纬度',
  `height` FLOAT NULL COMMENT '高度',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_panorama_id` (`panorama_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全景视点表';

-- 全景热点表
CREATE TABLE IF NOT EXISTS `biz_panorama_hotspot` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `panorama_id` BIGINT NOT NULL COMMENT '全景ID',
  `type` VARCHAR(20) NOT NULL COMMENT '热点类型',
  `config` TEXT NULL COMMENT '配置信息',
  `pos_x` FLOAT NULL COMMENT 'X位置',
  `pos_y` FLOAT NULL COMMENT 'Y位置',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_panorama_id` (`panorama_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全景热点表';

-- 资源数据表
CREATE TABLE IF NOT EXISTS `biz_resource` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(200) NOT NULL COMMENT '资源名称',
  `type` VARCHAR(20) NOT NULL COMMENT '资源类型',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父资源ID',
  `file_url` VARCHAR(500) NULL COMMENT '文件路径',
  `file_size` INT DEFAULT 0 COMMENT '文件大小',
  `mime_type` VARCHAR(100) NULL COMMENT 'MIME类型',
  `del_flag` TINYINT DEFAULT 0 COMMENT '删除标记',
  `create_by` VARCHAR(50) NULL COMMENT '创建人',
  `update_by` VARCHAR(50) NULL COMMENT '更新人',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源数据表';

-- ======================================================
-- 日志表
-- ======================================================

-- 登录日志表
CREATE TABLE IF NOT EXISTS `log_login` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `login_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `ip` VARCHAR(50) NULL COMMENT '登录IP',
  `os` VARCHAR(100) NULL COMMENT '操作系统',
  `browser` VARCHAR(100) NULL COMMENT '浏览器',
  `success` TINYINT DEFAULT 1 COMMENT '是否成功（1=成功，0=失败）',
  `fail_reason` VARCHAR(200) NULL COMMENT '失败原因',
  INDEX `idx_username` (`username`),
  INDEX `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS `log_operation` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `operator` VARCHAR(50) NULL COMMENT '操作人',
  `operate_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `type` VARCHAR(20) NULL COMMENT '操作类型',
  `target_id` VARCHAR(50) NULL COMMENT '操作对象ID',
  `description` VARCHAR(500) NULL COMMENT '操作描述',
  `method` VARCHAR(10) NULL COMMENT 'HTTP方法',
  `url` VARCHAR(500) NULL COMMENT '请求URL',
  `params` TEXT NULL COMMENT '请求参数',
  `status` INT DEFAULT 1 COMMENT '状态',
  `ip` VARCHAR(50) NULL COMMENT '操作IP',
  `duration` INT DEFAULT 0 COMMENT '耗时（毫秒）',
  INDEX `idx_operator` (`operator`),
  INDEX `idx_operate_time` (`operate_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 操作日志示例数据（开发联调）
INSERT INTO `log_operation` (`operator`, `operate_time`, `type`, `description`, `method`, `url`, `status`, `ip`) VALUES
('系统管理员', '2026-04-07 09:05:00', '编辑', '更新「大耳朵崖墓群」台账', 'PUT', '/api/v1/cliffs/1', 1, '10.0.0.12'),
('张三', '2026-04-07 09:18:00', '上传', '模型文件 coffin_m2.glb', 'POST', '/api/v1/coffins/2/resources', 1, '10.0.0.15'),
('系统管理员', '2026-04-07 09:42:00', '新增', '新增用户：王五', 'POST', '/api/v1/users', 1, '10.0.0.12'),
('李四', '2026-04-07 10:15:00', '查看', '查看崖墓详情', 'GET', '/api/v1/cliffs/1', 1, '10.0.0.18'),
('系统管理员', '2026-04-07 11:02:00', '删除', '删除过期通知公告', 'DELETE', '/api/v1/notices/3', 1, '10.0.0.12');

-- ======================================================
-- 字典数据初始化
-- ======================================================

-- 崖墓保护级别字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('cliff_level', 'national', '全国重点文物保护单位', 'national', 1, 1),
('cliff_level', 'provincial', '省级文物保护单位', 'provincial', 2, 1),
('cliff_level', 'city', '市级文物保护单位', 'city', 3, 1),
('cliff_level', 'county', '县级文物保护单位', 'county', 4, 1),
('cliff_level', 'unidentified', '未认定', 'unidentified', 5, 1);

-- 墓葬类别字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('cliff_category', 'emperor', '帝王陵寝', 'emperor', 1, 1),
('cliff_category', 'noble', '名人或贵族墓', 'noble', 2, 1),
('cliff_category', 'ordinary', '普通墓葬', 'ordinary', 3, 1),
('cliff_category', 'other', '其他古墓葬', 'other', 4, 1);

-- 文物级别字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('coffin_grade', 'first', '一级文物', 'first', 1, 1),
('coffin_grade', 'second', '二级文物', 'second', 2, 1),
('coffin_grade', 'third', '三级文物', 'third', 3, 1),
('coffin_grade', 'general', '一般文物', 'general', 4, 1);

-- 文物来源字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('coffin_source', 'excavation', '发掘', 'excavation', 1, 1),
('coffin_source', 'collection', '征集', 'collection', 2, 1),
('coffin_source', 'donation', '捐赠', 'donation', 3, 1),
('coffin_source', 'purchase', '收购', 'purchase', 4, 1),
('coffin_source', 'transfer', '拨交', 'transfer', 5, 1),
('coffin_source', 'other', '其他', 'other', 6, 1);

-- 完残程度字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('coffin_completeness', 'complete', '完整', 'complete', 1, 1),
('coffin_completeness', 'basically_complete', '基本完整', 'basically_complete', 2, 1),
('coffin_completeness', 'incomplete', '残缺', 'incomplete', 3, 1),
('coffin_completeness', 'broken', '破碎', 'broken', 4, 1);

-- 朝代字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('dynasty', 'han', '汉', 'han', 1, 1),
('dynasty', 'east_han', '东汉', 'east_han', 2, 1),
('dynasty', 'west_han', '西汉', 'west_han', 3, 1),
('dynasty', 'three_kingdoms', '三国', 'three_kingdoms', 4, 1),
('dynasty', 'tang', '唐', 'tang', 5, 1),
('dynasty', 'song', '宋', 'song', 6, 1),
('dynasty', 'ming', '明', 'ming', 7, 1),
('dynasty', 'qing', '清', 'qing', 8, 1),
('dynasty', 'unknown', '年代不详', 'unknown', 9, 1);

-- 资源类型字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('resource_type', 'doc', '数字文档', 'doc', 1, 1),
('resource_type', 'image', '平面影像', 'image', 2, 1),
('resource_type', 'model', '三维模型', 'model', 3, 1),
('resource_type', 'scan', '扫描数据', 'scan', 4, 1),
('resource_type', 'pointcloud', '点云数据', 'pointcloud', 5, 1),
('resource_type', 'deliverable', '成果数据', 'deliverable', 6, 1),
('resource_type', 'video', '视频', 'video', 7, 1);

-- 全景分类字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('panorama_category', 'air', '空中全景', 'air', 1, 1),
('panorama_category', 'ground', '地面全景', 'ground', 2, 1),
('panorama_category', 'inner', '内部全景', 'inner', 3, 1);

-- 石棺成果图类型字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('coffin_image_type', 'ortho', '数字正射影像图', 'ortho', 1, 1),
('coffin_image_type', 'rubbing', '数字拓片图', 'rubbing', 2, 1),
('coffin_image_type', 'line', '数字线划图', 'line', 3, 1),
('coffin_image_type', 'enhance', '数字信息增强图', 'enhance', 4, 1);

-- 用户状态字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('user_status', 'enabled', '启用', 'enabled', 1, 1),
('user_status', 'disabled', '禁用', 'disabled', 2, 1);

-- 数据范围字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('data_scope', 'all', '全部数据', 'all', 1, 1),
('data_scope', 'dept', '本部门数据', 'dept', 2, 1),
('data_scope', 'custom', '自定义数据', 'custom', 3, 1);

-- 操作类型字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('operation_type', 'view', '查看', 'view', 1, 1),
('operation_type', 'add', '新增', 'add', 2, 1),
('operation_type', 'edit', '编辑', 'edit', 3, 1),
('operation_type', 'delete', '删除', 'delete', 4, 1),
('operation_type', 'export', '导出', 'export', 5, 1),
('operation_type', 'publish', '发布', 'publish', 6, 1);

-- 功能权限字典
INSERT INTO `sys_dict` (`dict_type`, `dict_code`, `dict_label`, `dict_value`, `sort`, `status`) VALUES
('permission', 'm1', '系统管理（用户/角色/部门/岗位）', 'm1', 1, 1),
('permission', 'm2', '崖墓与墓口台账', 'm2', 2, 1),
('permission', 'm3', '石棺与文物资源', 'm3', 3, 1),
('permission', 'm4', '多媒体与全景', 'm4', 4, 1),
('permission', 'm5', '日志与审计（只读）', 'm5', 5, 1);

-- ======================================================
-- 初始化组织与权限数据
-- ======================================================

-- 部门
INSERT INTO `sys_dept` (`id`, `name`, `parent_id`, `sort`, `status`, `del_flag`) VALUES
(1, '合江崖墓数字化项目组', 0, 1, 1, 0),
(2, '博物馆', 1, 1, 1, 0),
(3, '信息中心', 2, 1, 1, 0),
(4, '展教部', 2, 2, 1, 0);

-- 角色
INSERT INTO `sys_role` (`id`, `name`, `code`, `type`, `data_scope`, `parent_id`, `sort`, `status`, `del_flag`) VALUES
(1, '系统管理员', 'SYS_ADMIN', 1, 'all', 0, 1, 1, 0),
(2, '业务管理员', 'BIZ_ADMIN', 1, 'dept', 1, 2, 1, 0),
(3, '内容编辑', 'EDITOR', 2, 'dept', 2, 3, 1, 0),
(4, '访客角色', 'GUEST', 2, 'all', 0, 4, 1, 0);

-- 岗位
INSERT INTO `sys_post` (`id`, `name`, `code`, `parent_id`, `sort`, `status`, `del_flag`) VALUES
(1, '馆长', 'director', 0, 1, 1, 0),
(2, '副馆长', 'vice_director', 1, 2, 1, 0),
(3, '展教专员', 'edu_staff', 2, 3, 1, 0);

-- 菜单
INSERT INTO `sys_menu` (`id`, `name`, `icon`, `parent_id`, `path`, `component`, `sort`, `type`, `perms`, `status`, `del_flag`) VALUES
(1,  '工作台',       'home-filled',    0,    NULL,                      NULL,                        0, 'M', NULL,                    1, 0),
(2,  '首页概览',     'home-filled',    1,    '/admin/dashboard',        'dashboard/index',           0, 'C', 'dashboard:list',        1, 0),
(3,  '业务数据',     'data-board',     0,    NULL,                      NULL,                        1, 'M', NULL,                    1, 0),
(4,  '崖墓管理',     'map-location',   3,    '/admin/cliff',            'cliff/index',               0, 'C', 'cliff:list',            1, 0),
(5,  '石棺管理',     'box',            3,    '/admin/coffin',           'coffin/index',              1, 'C', 'coffin:list',           1, 0),
(6,  '博物馆全景管理','picture',        3,    '/admin/panorama',         'museum/index',              2, 'C', 'panorama:list',         1, 0),
(7,  '资源管理',     'folder-opened',  3,    '/admin/resource',         'resource/index',            3, 'C', 'resource:list',         1, 0),
(8,  '组织与权限',   'user-filled',    0,    NULL,                      NULL,                        2, 'M', NULL,                    1, 0),
(9,  '用户管理',     'user',           8,    '/admin/user',             'system/user/index',         0, 'C', 'system:user:list',      1, 0),
(10, '角色管理',     'key',            8,    '/admin/role',             'system/role/index',         1, 'C', 'system:role:list',      1, 0),
(11, '部门管理',     'office-building',8,    '/admin/dept',             'system/dept/index',         2, 'C', 'system:dept:list',      1, 0),
(12, '岗位管理',     'suitcase',       8,    '/admin/post',             'system/post/index',         3, 'C', 'system:post:list',      1, 0),
(13, '日志与在线',   'list',           0,    NULL,                      NULL,                        3, 'M', NULL,                    1, 0),
(14, '操作日志',     'notebook',       13,   '/admin/log-operation',    'monitor/operlog/index',     0, 'C', 'monitor:operlog:list',  1, 0),
(15, '登录日志',     'alarm-clock',    13,   '/admin/log-login',        'monitor/logininfor/index',  1, 'C', 'monitor:logininfor:list',1, 0),
(16, '在线用户',     'connection',     13,   '/admin/online-user',      'monitor/online/index',      2, 'C', 'monitor:online:list',   1, 0),
(17, '运维监控',     'monitor',        0,    NULL,                      NULL,                        4, 'M', NULL,                    1, 0),
(18, '服务监控',     'cpu',            17,   '/admin/monitor-jvm',      'monitor/server/index',      0, 'C', 'monitor:server:list',   1, 0),
(19, '缓存监控',     'coin',           17,   '/admin/monitor-redis',    'monitor/cache/index',       1, 'C', 'monitor:cache:list',    1, 0),
(20, '系统配置',     'setting',        0,    NULL,                      NULL,                        5, 'M', NULL,                    1, 0),
(21, '菜单管理',     'menu',           20,   '/admin/menu',             'system/menu/index',         0, 'C', 'system:menu:list',      1, 0),
(22, '通知公告',     'bell',           20,   '/admin/notice',           'system/notice/index',       1, 'C', 'system:notice:list',    1, 0),
(23, '账户',         'avatar',         0,    NULL,                      NULL,                        6, 'M', NULL,                    1, 0),
(24, '个人信息',     'user-filled',    23,   '/admin/profile',          'system/profile/index',      0, 'C', 'system:profile:view',   1, 0);

-- 管理员账号（密码 admin，bcrypt hash）
INSERT INTO `sys_user` (`id`, `account`, `password`, `name`, `phone`, `dept_id`, `status`, `del_flag`) VALUES
(1, 'admin', '$2a$10$9klY3I4PXOt6BrFNyq94BO/2tV2zoql3EzWJD7tnvECJ0XTkpQjzi', '系统管理员', '13800000001', 3, 1, 0);

-- 用户角色关联
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1);

-- 用户岗位关联
INSERT INTO `sys_user_post` (`user_id`, `post_id`) VALUES
(1, 1);

-- ======================================================
-- 角色菜单关联（功能权限 — 菜单可见性）
-- ======================================================

-- 系统管理员：全部菜单
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
(1,21),(1,22),(1,23),(1,24);

-- 业务管理员：工作台 + 业务数据 + 日志与在线 + 账户
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,13),(2,14),(2,15),
(2,16),(2,23),(2,24);

-- 内容编辑：工作台 + 石棺/全景/资源 + 账户
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(3,1),(3,2),(3,3),(3,5),(3,6),(3,7),(3,23),(3,24);

-- 访客角色：工作台 + 业务数据（只读） + 日志与在线 + 账户
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(4,1),(4,2),(4,3),(4,4),(4,5),(4,6),(4,7),(4,13),(4,14),(4,15),
(4,16),(4,23),(4,24);

-- ======================================================
-- 角色权限关联（功能权限 — 细粒度权限标识）
-- ======================================================

-- 系统管理员：全部权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`) VALUES
(1,'m1'),(1,'m2'),(1,'m3'),(1,'m4'),(1,'m5');

-- 业务管理员：崖墓 + 石棺 + 多媒体
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`) VALUES
(2,'m2'),(2,'m3'),(2,'m4');

-- 内容编辑：石棺 + 多媒体
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`) VALUES
(3,'m3'),(3,'m4');

-- 访客角色：日志审计（只读）
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`) VALUES
(4,'m5');

-- ======================================================
-- 岗位权限关联
-- ======================================================

-- 馆长：全部权限
INSERT INTO `sys_post_permission` (`post_id`, `permission_id`) VALUES
(1,'m1'),(1,'m2'),(1,'m3'),(1,'m4'),(1,'m5');

-- 副馆长：崖墓 + 石棺 + 多媒体
INSERT INTO `sys_post_permission` (`post_id`, `permission_id`) VALUES
(2,'m2'),(2,'m3'),(2,'m4');

-- 展教专员：石棺 + 日志审计
INSERT INTO `sys_post_permission` (`post_id`, `permission_id`) VALUES
(3,'m3'),(3,'m5');

-- ======================================================
-- 脚本执行完成
-- 演示数据（崖墓/石棺/用户/日志等）请另行执行 demo数据初始化脚本.sql
-- 或在 hanheritage-api 目录执行: npm run db:seed
-- ======================================================

SELECT '数据库初始化脚本执行完成' AS result;
SELECT 'geo_town表记录数:', COUNT(*) FROM geo_town;
SELECT 'sys_dict表记录数:', COUNT(*) FROM sys_dict;
SELECT 'sys_user表记录数:', COUNT(*) FROM sys_user;