<?php // ["INSERT INTO `${p}theWebsite` VALUES('Basic site','en','{}',0)","INSERT INTO `${p}pageTypes` VALUES(1,'Pages','[{\"name\":\"categories\",\"dataType\":\"json\",\"friendlyName\":\"Categories\"}]','[]',1)","DROP TABLE IF EXISTS `${p}Pages`","CREATE TABLE `${p}Pages` (    `id` INTEGER PRIMARY KEY AUTOINCREMENT,    `slug` TEXT NOT NULL,    `path` TEXT,    `level` INTEGER NOT NULL DEFAULT 1,    `title` TEXT NOT NULL,    `layoutId` TEXT NOT NULL,    `blocks` JSON,    `status` INTEGER NOT NULL DEFAULT 0,    `categories` JSON)","INSERT INTO `${p}Pages` VALUES(1,'\/','todo',1,'Basic site example','1','[]',0,'{\"categories\":\"[]\"}')"]