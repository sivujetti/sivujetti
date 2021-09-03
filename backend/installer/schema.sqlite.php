<?php

return [
"DROP TABLE IF EXISTS `\${p}layoutBlocks`",
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
    `lastUpdatedAt` INTEGER NOT NULL DEFAULT 0
)",

"CREATE TABLE `\${p}plugins` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0
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

"CREATE TABLE `\${p}layoutBlocks` (
    `blocks` JSON,
    `layoutId` TEXT NOT NULL
)"
];
