<?php

$dataTypeForTimestamps = "INT(10) UNSIGNED NOT NULL DEFAULT 0";
$dataTypeForMaxIndexableText = "VARCHAR(191) NOT NULL"; // 191 * 4 = 767 bytes = max key length

return [
"DROP TABLE IF EXISTS `\${p}jobs`",
"DROP TABLE IF EXISTS `\${p}files`",
"DROP TABLE IF EXISTS `\${p}layouts`",
"DROP TABLE IF EXISTS `\${p}globalBlocksStyles`",
"DROP TABLE IF EXISTS `\${p}globalBlocks`",
"DROP TABLE IF EXISTS `\${p}PagesCategories`",
"DROP TABLE IF EXISTS `\${p}Pages`",
"DROP TABLE IF EXISTS `\${p}pageBlocksStyles`",
"DROP TABLE IF EXISTS `\${p}pageTypes`",
"DROP TABLE IF EXISTS `\${p}categories`",
"DROP TABLE IF EXISTS `\${p}plugins`",
"DROP TABLE IF EXISTS `\${p}themeBlockTypeStyles`",
"DROP TABLE IF EXISTS `\${p}themes`",
"DROP TABLE IF EXISTS `\${p}theWebsite`",
"DROP TABLE IF EXISTS `\${p}users`",

"CREATE TABLE `\${p}users` (
    `id` CHAR(36) NOT NULL,
    `username` VARCHAR(42) NOT NULL UNIQUE,
    `email` {$dataTypeForMaxIndexableText} UNIQUE,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` MEDIUMINT(8) UNSIGNED NOT NULL DEFAULT 8388608, -- 1 << 23
    `accountStatus` TINYINT(1) UNSIGNED DEFAULT 1, -- 0=activated, 1=unactivated, 2=banned
    `accountCreatedAt` {$dataTypeForTimestamps},
    `activationKey` VARCHAR(512) DEFAULT NULL,
    `resetKey` VARCHAR(512) DEFAULT NULL,
    `resetRequestedAt` {$dataTypeForTimestamps},
    `loginId` CHAR(32) DEFAULT NULL,
    `loginIdValidatorHash` CHAR(64) DEFAULT NULL,
    `loginData` TEXT,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}theWebsite` (
    `name` VARCHAR(92) NOT NULL,
    `lang` VARCHAR(12) NOT NULL,
    `aclRules` JSON,
    `firstRuns` JSON, -- {'userId': 'y', 'another': 'y'}
    `lastUpdatedAt` {$dataTypeForTimestamps},
    `newestCoreVersionLastChecked` {$dataTypeForTimestamps}
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}themes` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `globalStyles` JSON,
    `isActive` TINYINT(1) NOT NULL,
    `generatedBlockTypeBaseCss` TEXT,
    `generatedBlockCss` TEXT,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}themeBlockTypeStyles` (
    `styles` TEXT,
    `blockTypeName` VARCHAR(92) NOT NULL,
    `themeId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`blockTypeName`, `themeId`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}plugins` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `isActive` TINYINT(1) NOT NULL,
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
    `friendlyName` VARCHAR(92) NOT NULL,
    `friendlyNamePlural` VARCHAR(92) NOT NULL,
    `description` TEXT NOT NULL,
    `fields` JSON,
    `defaultLayoutId` {$dataTypeForMaxIndexableText},
    `status` TINYINT(1) DEFAULT 1, -- 0 = complete, 1 = draft
    `isListable` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}pageBlocksStyles` (
    `styles` TEXT,
    `pageId` SMALLINT UNSIGNED NOT NULL,
    `pageTypeName` VARCHAR(92) NOT NULL,
    `themeId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`pageId`, `pageTypeName`, `themeId`)
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

"CREATE TABLE `\${p}globalBlocks` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `blocks` JSON,
    `themeId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}globalBlocksStyles` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `styles` TEXT,
    `globalBlockTreeId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`globalBlockTreeId`) REFERENCES `\${p}globalBlocks`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}layouts` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `friendlyName` VARCHAR(92) NOT NULL,
    `relFilePath` VARCHAR(260) NOT NULL,
    `structure` JSON, -- see backend/sivujetti/src/Layout/Entities/Layout.php
    PRIMARY KEY (`id`)
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

"CREATE TABLE `\${p}jobs` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `jobName` VARCHAR(64) NOT NULL,
    `startedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"INSERT INTO `\${p}jobs` VALUES (1,'update-core',0)",
];
