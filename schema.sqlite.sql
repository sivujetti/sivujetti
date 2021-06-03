DROP TABLE IF EXISTS `blockProps`;
DROP TABLE IF EXISTS `blocks`;
DROP TABLE IF EXISTS `Pages`;
DROP TABLE IF EXISTS `contentTypes`;
DROP TABLE IF EXISTS `plugins`;
DROP TABLE IF EXISTS `theWebsite`;

CREATE TABLE `theWebsite` (
    `name` TEXT NOT NULL,
    `lang` TEXT NOT NULL,
    `aclRules` TEXT,
    `lastUpdatedAt` INTEGER DEFAULT 0
);

CREATE TABLE `plugins` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `status` INTEGER NOT NULL
);

CREATE TABLE `contentTypes` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `fields` TEXT,
    `isListable` INTEGER DEFAULT 1
);

CREATE TABLE `Pages` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `slug` TEXT NOT NULL,
    `title` TEXT NOT NULL,
    `template` TEXT NOT NULL
);

CREATE TABLE `blocks` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `type` TEXT NOT NULL,
    `section` TEXT NOT NULL,
    `renderer` TEXT NOT NULL,
    `pageId` INTEGER NOT NULL,
	`title`	TEXT DEFAULT NULL,
    FOREIGN KEY(`pageId`) REFERENCES `pages`(`id`)
);

CREATE TABLE `blockProps` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `key` TEXT NOT NULL,
    `value` TEXT,
    `blockId` INTEGER NOT NULL,
    FOREIGN KEY(`blockId`) REFERENCES `blocks`(`id`)
);
