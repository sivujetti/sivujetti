DROP TABLE IF EXISTS `blockProps`;
DROP TABLE IF EXISTS `blocks`;
DROP TABLE IF EXISTS `pages`;

CREATE TABLE `pages` (
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
    FOREIGN KEY(`pageId`) REFERENCES `pages`(`id`)
);

CREATE TABLE `blockProps` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `key` TEXT NOT NULL,
    `value` TEXT,
    `blockId` INTEGER NOT NULL,
    FOREIGN KEY(`blockId`) REFERENCES `blocks`(`id`)
);
