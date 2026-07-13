-- CreateTable
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `account` VARCHAR(50) NOT NULL,
    `password` VARCHAR(200) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `avatar` VARCHAR(500) NULL,
    `dept_id` BIGINT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_user_account_key`(`account`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` TINYINT NOT NULL DEFAULT 1,
    `data_scope` VARCHAR(20) NULL,
    `parent_id` BIGINT NULL DEFAULT 0,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_role_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dept` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `parent_id` BIGINT NULL DEFAULT 0,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `leader` VARCHAR(50) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_menu` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `parent_id` BIGINT NULL DEFAULT 0,
    `path` VARCHAR(200) NULL,
    `component` VARCHAR(200) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `type` VARCHAR(10) NOT NULL,
    `perms` VARCHAR(100) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_role` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_user_post` (
    `user_id` BIGINT NOT NULL,
    `post_id` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`, `post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_menu` (
    `role_id` BIGINT NOT NULL,
    `menu_id` BIGINT NOT NULL,

    PRIMARY KEY (`role_id`, `menu_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_permission` (
    `role_id` BIGINT NOT NULL,
    `permission_id` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_post` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `parent_id` BIGINT NULL DEFAULT 0,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(200) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_post_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_post_permission` (
    `post_id` BIGINT NOT NULL,
    `permission_id` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`post_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_dict` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `dict_type` VARCHAR(50) NOT NULL,
    `dict_code` VARCHAR(50) NOT NULL,
    `dict_label` VARCHAR(100) NOT NULL,
    `dict_value` VARCHAR(100) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(200) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_dict_dict_type_dict_code_key`(`dict_type`, `dict_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_notice` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NULL,
    `content_html` TEXT NULL,
    `type` VARCHAR(20) NOT NULL,
    `scope` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `published_at` DATETIME(3) NULL,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_cliff` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `lng` DECIMAL(10, 5) NULL,
    `lat` DECIMAL(10, 5) NULL,
    `area` DOUBLE NULL,
    `level` VARCHAR(20) NULL,
    `category` VARCHAR(20) NULL,
    `dynasty` VARCHAR(20) NULL,
    `description` TEXT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `biz_cliff_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_entrance` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cliff_id` BIGINT NOT NULL,
    `x` DOUBLE NULL,
    `y` DOUBLE NULL,
    `z` DOUBLE NULL,
    `direction` VARCHAR(20) NULL,
    `intro` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_coffin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `cliff_id` BIGINT NULL,
    `dynasty` VARCHAR(20) NULL,
    `grade` VARCHAR(20) NULL,
    `source` VARCHAR(20) NULL,
    `completeness` VARCHAR(20) NULL,
    `dimensions` VARCHAR(100) NULL,
    `texture` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `thumbnail` VARCHAR(500) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `biz_coffin_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_coffin_image` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `coffin_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `image_type` VARCHAR(20) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_coffin_model` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `coffin_id` BIGINT NOT NULL,
    `model_url` VARCHAR(500) NOT NULL,
    `format` VARCHAR(20) NOT NULL,
    `file_size` INTEGER NOT NULL DEFAULT 0,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_panorama` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(20) NULL,
    `location` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_panorama_viewpoint` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `panorama_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `lng` DECIMAL(10, 5) NULL,
    `lat` DECIMAL(10, 5) NULL,
    `height` DOUBLE NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_panorama_hotspot` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `panorama_id` BIGINT NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `config` TEXT NULL,
    `pos_x` DOUBLE NULL,
    `pos_y` DOUBLE NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_resource` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `parent_id` BIGINT NULL DEFAULT 0,
    `file_url` VARCHAR(500) NULL,
    `file_size` INTEGER NOT NULL DEFAULT 0,
    `mime_type` VARCHAR(100) NULL,
    `del_flag` TINYINT NOT NULL DEFAULT 0,
    `create_by` VARCHAR(50) NULL,
    `update_by` VARCHAR(50) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_login` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `login_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(50) NULL,
    `os` VARCHAR(100) NULL,
    `browser` VARCHAR(100) NULL,
    `success` TINYINT NOT NULL DEFAULT 1,
    `fail_reason` VARCHAR(200) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_operation` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `operator` VARCHAR(50) NULL,
    `operate_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(20) NULL,
    `target_id` VARCHAR(50) NULL,
    `description` VARCHAR(500) NULL,
    `method` VARCHAR(10) NULL,
    `url` VARCHAR(500) NULL,
    `params` TEXT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `ip` VARCHAR(50) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `geo_town` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `lng` DECIMAL(10, 5) NULL,
    `lat` DECIMAL(10, 5) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `remark` VARCHAR(200) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `geo_town_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_user` ADD CONSTRAINT `sys_user_dept_id_fkey` FOREIGN KEY (`dept_id`) REFERENCES `sys_dept`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_role` ADD CONSTRAINT `sys_role_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `sys_role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_dept` ADD CONSTRAINT `sys_dept_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `sys_dept`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_menu` ADD CONSTRAINT `sys_menu_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `sys_menu`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_user_role` ADD CONSTRAINT `sys_user_role_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_user_role` ADD CONSTRAINT `sys_user_role_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_user_post` ADD CONSTRAINT `sys_user_post_user_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_user_post` ADD CONSTRAINT `sys_user_post_post_fkey` FOREIGN KEY (`post_id`) REFERENCES `sys_post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_role_menu` ADD CONSTRAINT `sys_role_menu_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_role_menu` ADD CONSTRAINT `sys_role_menu_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `sys_menu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_role_permission` ADD CONSTRAINT `sys_role_permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_post` ADD CONSTRAINT `sys_post_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `sys_post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_post_permission` ADD CONSTRAINT `sys_post_permission_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `sys_post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_entrance` ADD CONSTRAINT `biz_entrance_cliff_id_fkey` FOREIGN KEY (`cliff_id`) REFERENCES `biz_cliff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_coffin` ADD CONSTRAINT `biz_coffin_cliff_id_fkey` FOREIGN KEY (`cliff_id`) REFERENCES `biz_cliff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_coffin_image` ADD CONSTRAINT `biz_coffin_image_coffin_id_fkey` FOREIGN KEY (`coffin_id`) REFERENCES `biz_coffin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_coffin_model` ADD CONSTRAINT `biz_coffin_model_coffin_id_fkey` FOREIGN KEY (`coffin_id`) REFERENCES `biz_coffin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_panorama_viewpoint` ADD CONSTRAINT `biz_panorama_viewpoint_panorama_id_fkey` FOREIGN KEY (`panorama_id`) REFERENCES `biz_panorama`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_panorama_hotspot` ADD CONSTRAINT `biz_panorama_hotspot_panorama_id_fkey` FOREIGN KEY (`panorama_id`) REFERENCES `biz_panorama`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biz_resource` ADD CONSTRAINT `biz_resource_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `biz_resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
