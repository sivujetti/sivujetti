<?php

$dataTypeForTimestamps = "INTEGER NOT NULL DEFAULT 0";

return [
"DROP TABLE IF EXISTS `\${p}jobs`",
"DROP TABLE IF EXISTS `\${p}snapshots`",
"DROP TABLE IF EXISTS `\${p}files`",
"DROP TABLE IF EXISTS `\${p}layouts`",
"DROP TABLE IF EXISTS `\${p}reusableBranches`",
"DROP TABLE IF EXISTS `\${p}globalBlockTrees`",
"DROP TABLE IF EXISTS `\${p}Pages`",
"DROP TABLE IF EXISTS `\${p}PagesCategories`",
"DROP TABLE IF EXISTS `\${p}pageTypes`",
"DROP TABLE IF EXISTS `\${p}plugins`",
"DROP TABLE IF EXISTS `\${p}themeStyles`",
"DROP TABLE IF EXISTS `\${p}themes`",
"DROP TABLE IF EXISTS `\${p}theWebsite`",
"DROP TABLE IF EXISTS `\${p}storedObjects`",
"DROP TABLE IF EXISTS `\${p}users`",

"CREATE TABLE `\${p}users` (
    `id` TEXT PRIMARY KEY,
    `username` TEXT NOT NULL UNIQUE,
    `email` TEXT NOT NULL UNIQUE,
    `passwordHash` TEXT NOT NULL,
    `role` INTEGER NOT NULL DEFAULT 8388608, -- 1 << 23
    `accountStatus` INTEGER DEFAULT 1, -- 0=activated, 1=unactivated, 2=banned
    `accountCreatedAt` INTEGER DEFAULT 0,
    `activationKey` TEXT DEFAULT NULL,
    `resetKey` TEXT DEFAULT NULL,
    `resetRequestedAt` INTEGER DEFAULT 0,
    `loginId` TEXT DEFAULT NULL,
    `loginIdValidatorHash` TEXT DEFAULT NULL,
    `loginData` TEXT
)",

"CREATE TABLE `\${p}storedObjects` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `objectName` TEXT NOT NULL,
    `data` JSON
)",

"CREATE TABLE `\${p}theWebsite` (
    `name` TEXT NOT NULL,
    `lang` TEXT NOT NULL, -- two letter language code (bcp47)
    `country` TEXT DEFAULT NULL, -- two letter country code (ISO3166 alpha 2)
    `description` TEXT,
    `hideFromSearchEngines` INTEGER NOT NULL DEFAULT 1,
    `aclRules` JSON,
    `firstRuns` JSON, -- {'userId': 'y', 'another': 'y'}
    `versionId` TEXT NOT NULL,
    `lastUpdatedAt` {$dataTypeForTimestamps},
    `latestPackagesLastCheckedAt` {$dataTypeForTimestamps},
    `pendingUpdates` JSON, -- [{name: 'sivujetti-0.16.0', sig: '<128-chars-long-string>'} ...]
    `headHtml` TEXT,
    `footHtml` TEXT
)",

"CREATE TABLE `\${p}themes` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `styleChunkBundlesAll` JSON, -- see backend/sivujetti/src/Theme/Entities/Theme.php
    `cachedCompiledScreenSizesCssLengths` TEXT, -- '1,0,0,0,0'
    `stylesOrder` JSON,
    `globalStyles` JSON,
    `isActive` INTEGER NOT NULL DEFAULT 0,
    `generatedScopedStylesCss` TEXT,
    `stylesLastUpdatedAt` TEXT -- '1701932634,0,0,0,0'
)",

"CREATE TABLE `\${p}themeStyles` (
    `units` JSON NOT NULL, -- see backend/sivujetti/src/Theme/Entities/Style.php
    `themeId` INTEGER NOT NULL,
    `blockTypeName` TEXT NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`themeId`, `blockTypeName`)
)",

"CREATE TABLE `\${p}plugins` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `isActive` INTEGER NOT NULL DEFAULT 0
)",

"CREATE TABLE `\${p}pageTypes` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `slug` TEXT NOT NULL,
    `friendlyName` TEXT NOT NULL,
    `friendlyNamePlural` TEXT NOT NULL,
    `description` TEXT NOT NULL,
    `fields` JSON,
    `defaultLayoutId` TEXT NOT NULL,
    `status` INTEGER DEFAULT 1, -- 0 = complete, 1 = draft
    `isListable` INTEGER DEFAULT 1
)",

"CREATE TABLE `\${p}PagesCategories` (
    `id` TEXT PRIMARY KEY,
    `slug` TEXT NOT NULL,
    `path` TEXT,
    `level` INTEGER NOT NULL DEFAULT 1,
    `title` TEXT NOT NULL,
    `meta` JSON,
    `layoutId` TEXT NOT NULL,
    `blocks` JSON,
    `status` INTEGER NOT NULL DEFAULT 0,
    `createdAt` {$dataTypeForTimestamps},
    `lastUpdatedAt` {$dataTypeForTimestamps}
)",

"CREATE TABLE `\${p}Pages` (
    `id` TEXT PRIMARY KEY,
    `slug` TEXT NOT NULL,
    `path` TEXT,
    `categories` JSON,
    `level` INTEGER NOT NULL DEFAULT 1,
    `title` TEXT NOT NULL,
    `meta` JSON,
    `layoutId` TEXT NOT NULL,
    `blocks` JSON,
    `status` INTEGER NOT NULL DEFAULT 0,
    `createdAt` {$dataTypeForTimestamps},
    `lastUpdatedAt` {$dataTypeForTimestamps}
)",

"CREATE TABLE `\${p}globalBlockTrees` (
    `id` TEXT PRIMARY KEY,
    `name` TEXT NOT NULL,
    `blocks` JSON
)",

"CREATE TABLE `\${p}reusableBranches` (
    `id` TEXT PRIMARY KEY,
    `blockBlueprints` JSON
)",

"CREATE TABLE `\${p}layouts` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `friendlyName` TEXT NOT NULL,
    `relFilePath` TEXT NOT NULL,
    `structure` JSON -- see backend/sivujetti/src/Layout/Entities/Layout.php
)",

"CREATE TABLE `\${p}files` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `fileName` TEXT NOT NULL, -- e.g. 'a-cat.png'
    `baseDir` TEXT NOT NULL, -- e.g. '' or 'sub-dir/' or 'sub-dir/another-dir/'
    `mime` TEXT NOT NULL,
    `friendlyName` TEXT NOT NULL,
    `createdAt` {$dataTypeForTimestamps},
    `updatedAt` {$dataTypeForTimestamps}
)",

"CREATE TABLE `\${p}jobs` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `jobName` TEXT NOT NULL,
    `startedAt` {$dataTypeForTimestamps}
)",

"CREATE TABLE `\${p}snapshots` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `table` TEXT,
    `data` JSON NOT NULL
)",

"INSERT INTO `\${p}jobs` VALUES (1,'updates:all',0)",
];
