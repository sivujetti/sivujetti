<?php // ["INSERT INTO `${p}theWebsite` VALUES('Basic site','en','US','My website','{\"resources\":{\"blocks\":{\"create\":2,\"renderOrView\":4},\"coreUpdates\":{\"checkAvailable\":2,\"install\":4},\"globalBlockTrees\":{\"create\":2,\"read\":4,\"updateBlocksOf\":8,\"update\":16},\"editMode\":{\"access\":2},\"layouts\":{\"list\":2,\"updateStructureOf\":4},\"pages\":{\"create\":2,\"list\":4,\"updateBlocksOf\":8,\"update\":16},\"pageTypes\":{\"create\":2,\"update\":4,\"delete\":8},\"themes\":{\"view\":2,\"updateGlobalStylesOf\":4,\"upsertBlockTypeScopedStyles\":8},\"uploads\":{\"view\":2,\"upload\":4}},\"userPermissions\":{\"2\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":30,\"editMode\":2,\"layouts\":6,\"pages\":30,\"pageTypes\":14,\"themes\":14,\"uploads\":6},\"4\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":30,\"editMode\":2,\"layouts\":6,\"pages\":30,\"themes\":14,\"uploads\":6},\"8\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":20,\"editMode\":2,\"layouts\":2,\"pages\":30,\"themes\":6,\"uploads\":6},\"16\":{\"editMode\":2,\"pages\":4}}}','{}',0,0)","INSERT INTO `${p}pageTypes` VALUES(1,'PagesCategories','\/pages-categories','Page category','Page categories','','{\"ownFields\":[],\"blockFields\":[],\"defaultFields\":{\"title\":{\"defaultValue\":\"Category name\"}}}','1',0,1),(2,'Pages','\/pages','Page','Pages','','{\"ownFields\":[{\"name\":\"categories\",\"dataType\":{\"type\":\"many-to-many\",\"rel\":\"PagesCategories\"},\"friendlyName\":\"Categories\",\"defaultValue\":[]}],\"blockFields\":[{\"type\":\"Paragraph\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"text\":\"Paragraph text\"},\"children\":[]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"New page\"}}}','1',0,1),(3,'ServicesCategories','\/services-categories','Service category','Service categories','','{\"ownFields\":[],\"blockFields\":[],\"defaultFields\":{\"title\":{\"defaultValue\":\"Category name\"}}}','1',0,1),(4,'Services','\/services','Service','Services','','{\"ownFields\":[{\"name\":\"categories\",\"dataType\":{\"type\":\"many-to-many\",\"rel\":\"ServicesCategories\"},\"friendlyName\":\"Categories\",\"defaultValue\":[]}],\"blockFields\":[{\"type\":\"Section\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-generic-wrapper\",\"initialData\":{\"bgImage\":\"\"},\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"text\":\"Service description\"},\"children\":[]}]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"Service name\"}}}','1',0,1)","INSERT INTO `${p}themes` VALUES('1','basic-site','[{\"name\":\"defaultTextColor\",\"friendlyName\":\"Text (default)\",\"value\":{\"type\":\"color\",\"value\":[\"44\",\"44\",\"44\",\"ff\"]}},{\"name\":\"secondaryTextColor\",\"friendlyName\":\"Text (secondary)\",\"value\":{\"type\":\"color\",\"value\":[\"21\",\"96\",\"f3\",\"ff\"]}}]',1,'\/* nothing *\/')","INSERT INTO `${p}themeStyles` VALUES('[{\"title\":\"Default\",\"id\":\"default\",\"scss\":\"> [data-block-root] {\\r\\n    max-width: 1100px;\\r\\n    margin: 0 auto;\\r\\n    padding: 6.4rem 3rem;\\r\\n}\",\"generatedCss\":\".j-Section-default>[data-block-root]{max-width:1100px;margin:0 auto;padding:6.4rem 3rem;}\"}]','1','Section')","DROP TABLE IF EXISTS `${p}Services`","DROP TABLE IF EXISTS `${p}ServicesCategories`","CREATE TABLE `${p}ServicesCategories` (    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,    `slug` VARCHAR(92) NOT NULL,    `path` VARCHAR(191) NOT NULL,    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,    `title` VARCHAR(92) NOT NULL,    `meta` JSON,    `layoutId` VARCHAR(191) NOT NULL,    `blocks` JSON,    `status` TINYINT(1) NOT NULL DEFAULT 0,    `createdAt` INT(10) UNSIGNED NOT NULL DEFAULT 0,    `lastUpdatedAt` INT(10) UNSIGNED NOT NULL DEFAULT 0    ,    PRIMARY KEY (`id`)) DEFAULT CHARSET = utf8mb4","CREATE TABLE `${p}Services` (    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,    `slug` VARCHAR(92) NOT NULL,    `path` VARCHAR(191) NOT NULL,    `level` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,    `title` VARCHAR(92) NOT NULL,    `meta` JSON,    `layoutId` VARCHAR(191) NOT NULL,    `blocks` JSON,    `status` TINYINT(1) NOT NULL DEFAULT 0,    `createdAt` INT(10) UNSIGNED NOT NULL DEFAULT 0,    `lastUpdatedAt` INT(10) UNSIGNED NOT NULL DEFAULT 0    ,    `categories` JSON,    PRIMARY KEY (`id`)) DEFAULT CHARSET = utf8mb4","INSERT INTO `${p}globalBlockTrees` VALUES('1','Header','[{\"type\":\"Section\",\"title\":\"Header\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDR\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"j-Section-header\",\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDT\",\"propsData\":[{\"key\":\"text\",\"value\":\"Heading\"},{\"key\":\"level\",\"value\":\"1\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Menu\",\"title\":\"\",\"renderer\":\"sivujetti:block-menu\",\"id\":\"EsmAW0--AnViMcwnIaDS\",\"propsData\":[{\"key\":\"tree\",\"value\":\"[{\\\\\"slug\\\\\":\\\\\"\\\\\\\/\\\\\",\\\\\"text\\\\\":\\\\\"Home\\\\\",\\\\\"id\\\\\":1,\\\\\"children\\\\\":[]},{\\\\\"slug\\\\\":\\\\\"\\\\\\\/company\\\\\",\\\\\"text\\\\\":\\\\\"Company\\\\\",\\\\\"id\\\\\":2,\\\\\"children\\\\\":[]},{\\\\\"slug\\\\\":\\\\\"\\\\\\\/services\\\\\",\\\\\"text\\\\\":\\\\\"Services\\\\\",\\\\\"id\\\\\":3,\\\\\"children\\\\\":[]},{\\\\\"slug\\\\\":\\\\\"\\\\\\\/contact\\\\\",\\\\\"text\\\\\":\\\\\"Contact\\\\\",\\\\\"id\\\\\":4,\\\\\"children\\\\\":[]}]\"},{\"key\":\"wrapStart\",\"value\":\"<nav><div>\"},{\"key\":\"wrapEnd\",\"value\":\"<\\\/div><\\\/nav>\"},{\"key\":\"treeStart\",\"value\":\"<ul class=\\\\\"level-{depth}\\\\\">\"},{\"key\":\"treeEnd\",\"value\":\"<\\\/ul>\"},{\"key\":\"itemStart\",\"value\":\"<li class=\\\\\"level-{depth}\\\\\"{current}>\"},{\"key\":\"itemAttrs\",\"value\":\"[]\"},{\"key\":\"itemEnd\",\"value\":\"<\\\/li>\"}],\"styleClasses\":\"\",\"children\":[]}]}]'),('2','Footer','[{\"type\":\"Section\",\"title\":\"Footer\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDP\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"j-Section-footer\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDQ\",\"propsData\":[{\"key\":\"text\",\"value\":\"Footer text\"}],\"styleClasses\":\"\",\"children\":[]}]}]')","INSERT INTO `${p}layouts` VALUES('1','Default','layout.default.tmpl.php','[{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"1\"},{\"type\":\"pageContents\"},{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"2\"}]')","INSERT INTO `${p}PagesCategories` VALUES(1,'\/uncategorized','uncategorized\/',1,'Uncategorized','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDO\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDL\",\"propsData\":[{\"key\":\"text\",\"value\":\"Uncategorized\"}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030)","INSERT INTO `${p}Pages` VALUES(1,'\/','\/','[]',1,'Home page','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDK\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDJ\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDG\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDH\",\"propsData\":[{\"key\":\"text\",\"value\":\"Home page text\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDI\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030),(2,'\/company','company\/','[]',1,'Company','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDF\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDE\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Columns\",\"title\":\"\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaD6\",\"propsData\":[{\"key\":\"numColumns\",\"value\":\"2\"},{\"key\":\"takeFullWidth\",\"value\":1}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDA\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDC\",\"propsData\":[{\"key\":\"text\",\"value\":\"Company\"},{\"key\":\"level\",\"value\":2}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDB\",\"propsData\":[{\"key\":\"text\",\"value\":\"Company page text\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"Section\",\"title\":\"Sidebar\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaD7\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD9\",\"propsData\":[{\"key\":\"text\",\"value\":\"Sidebar\"},{\"key\":\"level\",\"value\":3}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD8\",\"propsData\":[{\"key\":\"text\",\"value\":\"Text\"}],\"styleClasses\":\"\",\"children\":[]}]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDD\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030),(3,'\/services','services\/','[]',1,'Services','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD5\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD4\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaD1\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Listing\",\"title\":\"\",\"renderer\":\"site:block-services-listing\",\"id\":\"EsmAW0--AnViMcwnIaD2\",\"propsData\":[{\"key\":\"filterPageType\",\"value\":\"Services\"},{\"key\":\"filterLimit\",\"value\":0},{\"key\":\"filterOrder\",\"value\":\"desc\"},{\"key\":\"filterAdditional\",\"value\":\"{}\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD3\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030),(4,'\/contact','contact\/','[]',1,'Contact','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD0\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD-\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCx\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCy\",\"propsData\":[{\"key\":\"text\",\"value\":\"Contact page text\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCz\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030)","INSERT INTO `${p}ServicesCategories` VALUES(1,'\/uncategorized','services-categories\/uncategorized\/',1,'Uncategorized','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCw\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCt\",\"propsData\":[{\"key\":\"text\",\"value\":\"Uncategorized\"}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030)","INSERT INTO `${p}Services` VALUES(1,'\/service-1','services\/service-1\/','[]',1,'Service 1','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCs\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCr\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCo\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCp\",\"propsData\":[{\"key\":\"text\",\"value\":\"Service1 description\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCq\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030),(2,'\/service-2','services\/service-2\/','[]',1,'Service 2','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCn\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCm\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCj\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCk\",\"propsData\":[{\"key\":\"text\",\"value\":\"Service2 description\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCl\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030),(3,'\/service-3','services\/service-3\/','[]',1,'Service 3','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCi\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCh\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCe\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCf\",\"propsData\":[{\"key\":\"text\",\"value\":\"Service3 description\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCg\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659074030,1659074030)","INSERT INTO `${p}files` (`fileName`,`baseDir`,`mime`,`friendlyName`,`createdAt`) VALUES('sample.jpg','','image\/jpg','',1659074030)"]