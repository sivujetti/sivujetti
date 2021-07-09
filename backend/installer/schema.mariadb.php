<?php

return [
"USE `\${database}`",

"DROP TABLE IF EXISTS `\${p}layoutBlocks`",
"DROP TABLE IF EXISTS `\${p}Pages`",
"DROP TABLE IF EXISTS `\${p}pageTypes`",
"DROP TABLE IF EXISTS `\${p}plugins`",
"DROP TABLE IF EXISTS `\${p}theWebsite`",

"CREATE TABLE `\${p}theWebsite` (
    `name` VARCHAR(92) NOT NULL,
    `lang` VARCHAR(12) NOT NULL,
    `aclRules` JSON,
    `lastUpdatedAt` INT(10) UNSIGNED DEFAULT 0
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}plugins` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `status` TINYINT(1) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}pageTypes` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92)  NOT NULL,
    `ownFields` JSON,
    `blockFields` JSON,
    `isListable` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}Pages` (
    `id` MEDIUMINT UNSIGNED NOT NULL PRIMARY KEY AUTOINCREMENT,
    `slug` VARCHAR(92) NOT NULL,
    `path` VARCHAR(191) NOT NULL, -- 191 * 4 = 767 bytes = max key length
    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(92) NOT NULL,
    `layoutId` VARCHAR(191) NOT NULL,
    `blocks` JSON,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    `categories` JSON
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}layoutBlocks` (
    `data` JSON,
    `layoutId` VARCHAR(191) NOT NULL
) DEFAULT CHARSET = utf8mb4",
];
