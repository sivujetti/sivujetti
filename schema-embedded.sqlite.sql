DROP TABLE IF EXISTS `layoutBlocks`;
DROP TABLE IF EXISTS `pages`;
DROP TABLE IF EXISTS `pageTypes`;
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

CREATE TABLE `pageTypes` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `fields` TEXT,
    `isListable` INTEGER DEFAULT 1
);

CREATE TABLE `pages` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `slug` TEXT NOT NULL,
    `path` TEXT, -- todo ids or slugs?
    `level` INTEGER NOT NULL DEFAULT 1,
    `title` TEXT NOT NULL,
    `layout` TEXT NOT NULL,
    `blocks` TEXT,
    `status` INTEGER NOT NULL DEFAULT 0,
    `pageTypeId` INTEGER NOT NULL,
    FOREIGN KEY(`pageTypeId`) REFERENCES `pageTypes`(`id`)
);

CREATE TABLE `layoutBlocks` (
    `data` TEXT
);
