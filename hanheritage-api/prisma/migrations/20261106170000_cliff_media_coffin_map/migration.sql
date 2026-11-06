-- AlterTable
ALTER TABLE `biz_cliff` ADD COLUMN `cover_image` VARCHAR(500) NULL,
    ADD COLUMN `model_url` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `biz_coffin` ADD COLUMN `map_left` DOUBLE NULL,
    ADD COLUMN `map_top` DOUBLE NULL;

-- CreateTable
CREATE TABLE `biz_cliff_image` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cliff_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `image_type` VARCHAR(20) NOT NULL DEFAULT 'photo',
    `sort` INTEGER NOT NULL DEFAULT 0,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `biz_cliff_image` ADD CONSTRAINT `biz_cliff_image_cliff_id_fkey` FOREIGN KEY (`cliff_id`) REFERENCES `biz_cliff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
