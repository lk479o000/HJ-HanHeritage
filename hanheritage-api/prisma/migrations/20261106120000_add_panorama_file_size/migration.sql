-- 为博物馆全景资源增加文件大小字段（单位：字节）
ALTER TABLE `biz_panorama` ADD COLUMN `file_size` INT NOT NULL DEFAULT 0 COMMENT '文件大小(字节)' AFTER `image_url`;
