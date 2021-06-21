DROP TABLE IF EXISTS `layoutBlocks`;
DROP TABLE IF EXISTS `pages`;
DROP TABLE IF EXISTS `pageTypes`;
DROP TABLE IF EXISTS `plugins`;
DROP TABLE IF EXISTS `theWebsite`;

CREATE TABLE `theWebsite` (
    `name` VARCHAR(92) NOT NULL,
    `lang` VARCHAR(12) NOT NULL,
    `aclRules` JSON,
    `lastUpdatedAt` INT(10) UNSIGNED DEFAULT 0
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `plugins` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `status` TINYINT(1) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `pageTypes` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92)  NOT NULL,
    `fields` JSON,
    `isListable` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `pages` (
    `id` MEDIUMINT UNSIGNED NOT NULL PRIMARY KEY AUTOINCREMENT,
    `slug` VARCHAR(92) NOT NULL,
    `path` VARCHAR(191) NOT NULL, -- 191 * 4 = 767 bytes = max key length
    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(92) NOT NULL,
    `layout` VARCHAR(128) NOT NULL,
    `blocks` JSON,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    `pageTypeId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY(`pageTypeId`) REFERENCES `pageTypes`(`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE `layoutBlocks` (
    `data` JSON
) DEFAULT CHARSET = utf8mb4;
