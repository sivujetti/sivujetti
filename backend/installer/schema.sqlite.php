<?php

$dataTypeForTimestamps = "INTEGER NOT NULL DEFAULT 0";

return [
"DROP TABLE IF EXISTS `\${p}jobs`",
"DROP TABLE IF EXISTS `\${p}files`",
"DROP TABLE IF EXISTS `\${p}layouts`",
"DROP TABLE IF EXISTS `\${p}globalBlockStyles`",
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

"CREATE TABLE `\${p}theWebsite` (
    `name` TEXT NOT NULL,
    `lang` TEXT NOT NULL,
    `aclRules` JSON,
    `firstRuns` JSON, -- {'userId': 'y', 'another': 'y'}
    `lastUpdatedAt` {$dataTypeForTimestamps},
    `newestCoreVersionLastChecked` {$dataTypeForTimestamps}
)",

"CREATE TABLE `\${p}themes` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `globalStyles` JSON,
    `isActive` INTEGER NOT NULL DEFAULT 0
)",

"CREATE TABLE `\${p}themeBlockTypeStyles` (
    `styles` TEXT,
    `blockTypeName` TEXT NOT NULL,
    `themeId` INTEGER NOT NULL,
    FOREIGN KEY (`themeId`) REFERENCES `\${p}themes`(`id`),
    PRIMARY KEY (`blockTypeName`, `themeId`)
)",

"CREATE TABLE `\${p}plugins` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `isActive` INTEGER NOT NULL DEFAULT 0
)",

"CREATE TABLE `\${p}categories` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `slug` TEXT NOT NULL,
    `path` TEXT,
    `level` INTEGER NOT NULL DEFAULT 1,
    `title` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0
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

"CREATE TABLE `\${p}pageBlocksStyles` (
    `styles` TEXT,
    `pageId` INTEGER NOT NULL,
    `pageTypeName` TEXT NOT NULL,
    PRIMARY KEY (`pageId`, `pageTypeName`)
)",

"CREATE TABLE `\${p}Pages` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `slug` TEXT NOT NULL,
    `path` TEXT,
    `level` INTEGER NOT NULL DEFAULT 1,
    `title` TEXT NOT NULL,
    `layoutId` TEXT NOT NULL,
    `blocks` JSON,
    `status` INTEGER NOT NULL DEFAULT 0
)",

"CREATE TABLE `\${p}PagesCategories` (
    `pageId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    FOREIGN KEY (`pageId`) REFERENCES `\${p}Pages`(`id`),
    FOREIGN KEY (`categoryId`) REFERENCES `\${p}categories`(`id`),
    PRIMARY KEY (`pageId`, `categoryId`)
)",

"CREATE TABLE `\${p}globalBlocks` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `blocks` JSON
)",

"CREATE TABLE `\${p}globalBlockStyles` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `styles` TEXT,
    `globalBlockTreeId` INTEGER NOT NULL,
    FOREIGN KEY (`globalBlockTreeId`) REFERENCES `\${p}globalBlocks`(`id`)
)",

"CREATE TABLE `\${p}layouts` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `friendlyName` TEXT NOT NULL,
    `relFilePath` TEXT NOT NULL,
    `structure` JSON -- see backend/sivujetti/src/Layout/Entities/Layout.php
)",

"CREATE TABLE `\${p}files` (
    `fileName` TEXT NOT NULL, -- e.g. 'a-cat.png'
    `baseDir` TEXT NOT NULL, -- e.g. '' or 'sub-dir/' or 'sub-dir/another-dir/'
    `mime` TEXT NOT NULL,
    `friendlyName` TEXT NOT NULL,
    `createdAt` {$dataTypeForTimestamps},
    `updatedAt` {$dataTypeForTimestamps},
    PRIMARY KEY (`fileName`, `baseDir`)
)",

"CREATE TABLE `\${p}jobs` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `jobName` TEXT NOT NULL,
    `startedAt` {$dataTypeForTimestamps}
)",

"INSERT INTO `\${p}jobs` VALUES (1,'update-core',0)",
];
