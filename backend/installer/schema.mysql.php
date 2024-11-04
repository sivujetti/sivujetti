<?php

$dataTypeForTimestamps = "INT(10) UNSIGNED NOT NULL DEFAULT 0";
$dataTypeForMaxIndexableText = "VARCHAR(191) NOT NULL"; // 191 * 4 = 767 bytes = max key length

return [
"DROP TABLE IF EXISTS `\${p}jobs`",
"DROP TABLE IF EXISTS `\${p}snapshots`",
"DROP TABLE IF EXISTS `\${p}files`",
"DROP TABLE IF EXISTS `\${p}layouts`",
"DROP TABLE IF EXISTS `\${p}contentTemplates`",
"DROP TABLE IF EXISTS `\${p}reusableBranches`",
"DROP TABLE IF EXISTS `\${p}globalBlockTrees`",
"DROP TABLE IF EXISTS `\${p}Pages`",
"DROP TABLE IF EXISTS `\${p}PagesCategories`",
"DROP TABLE IF EXISTS `\${p}pageTypes`",
"DROP TABLE IF EXISTS `\${p}plugins`",
"DROP TABLE IF EXISTS `\${p}pageThemeStyles`",
"DROP TABLE IF EXISTS `\${p}themeStyles`",
"DROP TABLE IF EXISTS `\${p}themes`",
"DROP TABLE IF EXISTS `\${p}theWebsite`",
"DROP TABLE IF EXISTS `\${p}storedObjects`",
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

"CREATE TABLE `\${p}storedObjects` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `objectName` VARCHAR(255) NOT NULL,
    `data` JSON,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}theWebsite` (
    `name` VARCHAR(92) NOT NULL,
    `lang` VARCHAR(6) NOT NULL, -- two letter language code (bcp47)
    `country` VARCHAR(12) DEFAULT NULL, -- two letter country code (ISO3166 alpha 2)
    `description` TEXT,
    `hideFromSearchEngines` TINYINT(1) UNSIGNED DEFAULT 1,
    `aclRules` JSON,
    `firstRuns` JSON, -- {'userId': 'y', 'another': 'y'}
    `versionId` CHAR(8) NOT NULL,
    `lastUpdatedAt` {$dataTypeForTimestamps},
    `latestPackagesLastCheckedAt` {$dataTypeForTimestamps},
    `pendingUpdates` JSON, -- [{name: 'sivujetti-0.16.0', sig: '<128-chars-long-string>'} ...]
    `headHtml` TEXT,
    `footHtml` TEXT
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}themes` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `styleChunkBundlesAll` JSON, -- see backend/sivujetti/src/Theme/Entities/Theme.php
    `cachedCompiledScreenSizesCssHashes` TEXT, -- 'dffd60...'
    `stylesOrder` JSON,
    `globalStyles` JSON,
    `isActive` TINYINT(1) NOT NULL,
    `generatedScopedStylesCss` TEXT,
    `stylesLastUpdatedAt` VARCHAR(54), -- '1701932634'
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}themeStyles` (
    `units` JSON NOT NULL, -- see backend/sivujetti/src/Theme/Entities/Style.php
    `themeId` SMALLINT UNSIGNED NOT NULL,
    `blockTypeName` VARCHAR(92) NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`themeId`, `blockTypeName`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}pageThemeStyles` (
    `chunks` JSON NOT NULL,
    `pageId` CHAR(20) NOT NULL,
    `pageType` VARCHAR(92) NOT NULL,
    `themeId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`pageId`, `pageType`, `themeId`)
)",

"CREATE TABLE `\${p}plugins` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(92) NOT NULL,
    `isActive` TINYINT(1) NOT NULL,
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

"CREATE TABLE `\${p}PagesCategories` (
    `id` CHAR(20) NOT NULL,
    `slug` VARCHAR(92) NOT NULL,
    `path` {$dataTypeForMaxIndexableText},
    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(92) NOT NULL,
    `meta` JSON,
    `layoutId` {$dataTypeForMaxIndexableText},
    `blocks` JSON,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` {$dataTypeForTimestamps},
    `lastUpdatedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}Pages` (
    `id` CHAR(20) NOT NULL,
    `slug` VARCHAR(92) NOT NULL,
    `path` {$dataTypeForMaxIndexableText},
    `categories` JSON,
    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(92) NOT NULL,
    `meta` JSON,
    `layoutId` {$dataTypeForMaxIndexableText},
    `blocks` JSON,
    `status` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` {$dataTypeForTimestamps},
    `lastUpdatedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}globalBlockTrees` (
    `id` CHAR(20) NOT NULL,
    `name` VARCHAR(92) NOT NULL,
    `blocks` JSON,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}reusableBranches` (
    `id` CHAR(20) NOT NULL,
    `blockBlueprints` JSON,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}contentTemplates` (
    `id` CHAR(20) NOT NULL,
    -- todo
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
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(255) NOT NULL, -- e.g. 'a-cat.png'
    `baseDir` VARCHAR(260) NOT NULL, -- e.g. '' or 'sub-dir/' or 'sub-dir/another-dir/'
    `mime` VARCHAR(255) NOT NULL,
    `friendlyName` VARCHAR(255) NOT NULL,
    `createdAt` {$dataTypeForTimestamps},
    `updatedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}jobs` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `jobName` VARCHAR(64) NOT NULL,
    `startedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"CREATE TABLE `\${p}snapshots` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `table` {$dataTypeForMaxIndexableText},
    `data` JSON NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4",

"INSERT INTO `\${p}jobs` VALUES (1,'updates:all',0)",
];
