<?php

$dataTypeForTimestamps = "INT(10) UNSIGNED NOT NULL DEFAULT 0";
$dataTypeForMaxIndexableText = "VARCHAR(191) NOT NULL"; // 191 * 4 = 767 bytes = max key length

return [
"DROP TABLE IF EXISTS `\${p}files`",
"DROP TABLE IF EXISTS `\${p}layoutBlocks`",
"DROP TABLE IF EXISTS `\${p}PagesCategories`",
"DROP TABLE IF EXISTS `\${p}Pages`",
"DROP TABLE IF EXISTS `\${p}pageTypes`",
"DROP TABLE IF EXISTS `\${p}categories`",
"DROP TABLE IF EXISTS `\${p}plugins`",
"DROP TABLE IF EXISTS `\${p}theWebsite`",

"CREATE TABLE `\${p}theWebsite` (
    `name` VARCHAR(92) NOT NULL,
    `lang` VARCHAR(12) NOT NULL,
    `aclRules` JSON,
    `lastUpdatedAt` {$dataTypeForTimestamps}
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}plugins` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `status` TINYINT(1) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}categories` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(92) NOT NULL,
    `path` {$dataTypeForMaxIndexableText},
    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(92) NOT NULL,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}pageTypes` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `slug` VARCHAR(92) NOT NULL,
    `fields` JSON,
    `isListable` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}Pages` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(92) NOT NULL,
    `path` {$dataTypeForMaxIndexableText},
    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(92) NOT NULL,
    `layoutId` {$dataTypeForMaxIndexableText},
    `blocks` JSON,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}PagesCategories` (
    `pageId` MEDIUMINT UNSIGNED NOT NULL,
    `categoryId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`pageId`) REFERENCES `\${p}Pages`(`id`),
    FOREIGN KEY (`categoryId`) REFERENCES `\${p}categories`(`id`),
    PRIMARY KEY (`pageId`, `categoryId`)
)",

"CREATE TABLE `\${p}layoutBlocks` (
    `blocks` JSON,
    `layoutId` {$dataTypeForMaxIndexableText}
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}files` (
    `fileName` VARCHAR(127) NOT NULL, -- e.g. 'a-cat.png'
    `baseDir` VARCHAR(260) NOT NULL, -- e.g. '' or 'sub-dir/' or 'sub-dir/another-dir/'
    `mime` VARCHAR(255) NOT NULL,
    `friendlyName` VARCHAR(64) NOT NULL,
    `createdAt` {$dataTypeForTimestamps},
    `updatedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`fileName`, `baseDir`)
) DEFAULT CHARSET = utf8mb4",
];
