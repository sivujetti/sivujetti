<?php

$dataTypeForTimestamps = "INTEGER NOT NULL DEFAULT 0";

return [
"DROP TABLE IF EXISTS `\${p}jobs`",
"DROP TABLE IF EXISTS `\${p}files`",
"DROP TABLE IF EXISTS `\${p}layoutBlocks`",
"DROP TABLE IF EXISTS `\${p}globalBlocks`",
"DROP TABLE IF EXISTS `\${p}PagesCategories`",
"DROP TABLE IF EXISTS `\${p}Pages`",
"DROP TABLE IF EXISTS `\${p}pageTypes`",
"DROP TABLE IF EXISTS `\${p}categories`",
"DROP TABLE IF EXISTS `\${p}plugins`",
"DROP TABLE IF EXISTS `\${p}theWebsite`",

"CREATE TABLE `\${p}theWebsite` (
    `name` TEXT NOT NULL,
    `lang` TEXT NOT NULL,
    `aclRules` JSON,
    `lastUpdatedAt` {$dataTypeForTimestamps},
    `newestCoreVersionLastChecked` {$dataTypeForTimestamps}
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
    `fields` JSON,
    `defaultLayoutId` TEXT NOT NULL,
    `isListable` INTEGER DEFAULT 1
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
    `blockTree` JSON
)",

"CREATE TABLE `\${p}layoutBlocks` (
    `blocks` JSON,
    `layoutId` TEXT NOT NULL
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
