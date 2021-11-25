<?php // ["INSERT INTO `${p}theWebsite` VALUES('Basic site','en','{\"resources\":{\"blocks\":{\"create\":2,\"render\":4},\"coreUpdates\":{\"checkAvailable\":2,\"install\":4},\"globalBlockTrees\":{\"create\":2,\"list\":4,\"update\":8},\"editMode\":{\"access\":2},\"layouts\":{\"list\":2,\"updateStructureOf\":4},\"pages\":{\"create\":2,\"updateBlocksOf\":4,\"update\":8},\"uploads\":{\"view\":2,\"upload\":4}},\"userPermissions\":{\"2\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":14,\"editMode\":2,\"layouts\":6,\"pages\":14,\"uploads\":6}}}',0,0)","INSERT INTO `${p}pageTypes` VALUES(1,'Pages','pages','{\"ownFields\":[{\"name\":\"categories\",\"dataType\":\"many-to-many\",\"friendlyName\":\"Categories\",\"defaultValue\":\"[]\"}],\"blockFields\":[{\"type\":\"Paragraph\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"text\":\"Paragraph text\",\"cssClass\":\"\"},\"children\":[]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"New page\"}}}','1',1),(2,'Services','services','{\"ownFields\":[{\"name\":\"categories\",\"dataType\":\"many-to-many\",\"friendlyName\":\"Categories\",\"defaultValue\":\"[]\"}],\"blockFields\":[{\"type\":\"Section\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-generic-wrapper\",\"initialData\":{\"bgImage\":\"\",\"cssClass\":\"\"},\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"text\":\"Service description\",\"cssClass\":\"\"},\"children\":[]}]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"Service name\"}}}','1',1)","DROP TABLE IF EXISTS `${p}Services`","DROP TABLE IF EXISTS `${p}serviceCategories`","CREATE TABLE `${p}Services` (    `id` INTEGER PRIMARY KEY AUTOINCREMENT,    `slug` TEXT NOT NULL,    `path` TEXT,    `level` INTEGER NOT NULL DEFAULT 1,    `title` TEXT NOT NULL,    `layoutId` TEXT NOT NULL,    `blocks` JSON,    `status` INTEGER NOT NULL DEFAULT 0)","CREATE TABLE `${p}serviceCategories` (    `serviceId` INTEGER NOT NULL,    `categoryId` INTEGER NOT NULL,    FOREIGN KEY (`serviceId`) REFERENCES `${p}Services`(`id`),    FOREIGN KEY (`categoryId`) REFERENCES `${p}categories`(`id`),    PRIMARY KEY (`serviceId`, `categoryId`))","INSERT INTO `${p}globalBlocks` VALUES('1','Header','[{\"type\":\"Section\",\"title\":\"Header\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDR\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"header\"}],\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDT\",\"propsData\":[{\"key\":\"text\",\"value\":\"Heading\"},{\"key\":\"level\",\"value\":\"1\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Menu\",\"title\":\"\",\"renderer\":\"sivujetti:block-menu\",\"id\":\"EsmAW0--AnViMcwnIaDS\",\"propsData\":[{\"key\":\"tree\",\"value\":\"[{\\\"slug\\\":\\\"\\\\\\\/\\\",\\\"text\\\":\\\"Home\\\",\\\"id\\\":1,\\\"children\\\":[]},{\\\"slug\\\":\\\"\\\\\\\/company\\\",\\\"text\\\":\\\"Company\\\",\\\"id\\\":2,\\\"children\\\":[]},{\\\"slug\\\":\\\"\\\\\\\/services\\\",\\\"text\\\":\\\"Services\\\",\\\"id\\\":3,\\\"children\\\":[]},{\\\"slug\\\":\\\"\\\\\\\/contact\\\",\\\"text\\\":\\\"Contact\\\",\\\"id\\\":4,\\\"children\\\":[]}]\"},{\"key\":\"wrapStart\",\"value\":\"<nav><div>\"},{\"key\":\"wrapEnd\",\"value\":\"<\\\/div><\\\/nav>\"},{\"key\":\"treeStart\",\"value\":\"<ul class=\\\"level-{depth}\\\">\"},{\"key\":\"treeEnd\",\"value\":\"<\\\/ul>\"},{\"key\":\"itemAttrs\",\"value\":\"[]\"},{\"key\":\"itemStart\",\"value\":\"<li class=\\\"level-{depth}\\\"{current}>\"},{\"key\":\"itemEnd\",\"value\":\"<\\\/li>\"}],\"children\":[]}]}]'),('2','Footer','[{\"type\":\"Section\",\"title\":\"Footer\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDP\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"footer\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDQ\",\"propsData\":[{\"key\":\"text\",\"value\":\"Footer text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]}]')","INSERT INTO `${p}layouts` VALUES('1','Default','layout.default.tmpl.php','[{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"1\"},{\"type\":\"pageContents\"},{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"2\"}]')","INSERT INTO `${p}Pages` VALUES(1,'\/','todo',1,'Home page','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDO\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDN\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDK\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDL\",\"propsData\":[{\"key\":\"text\",\"value\":\"Home page text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDM\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0),(2,'\/company','todo',1,'Company','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDJ\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDI\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Columns\",\"title\":\"\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDA\",\"propsData\":[{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDE\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDG\",\"propsData\":[{\"key\":\"text\",\"value\":\"Company\"},{\"key\":\"level\",\"value\":2},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDF\",\"propsData\":[{\"key\":\"text\",\"value\":\"Company page text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"Section\",\"title\":\"Sidebar\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDB\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"aside-column\"}],\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDD\",\"propsData\":[{\"key\":\"text\",\"value\":\"Sidebar\"},{\"key\":\"level\",\"value\":3},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDC\",\"propsData\":[{\"key\":\"text\",\"value\":\"Text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDH\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0),(3,'\/services','todo',1,'Services','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD9\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD8\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Section\",\"title\":\"\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaD5\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[{\"type\":\"ServicesListing\",\"title\":\"\",\"renderer\":\"site:block-services-listing\",\"id\":\"EsmAW0--AnViMcwnIaD6\",\"propsData\":[{\"key\":\"listPageType\",\"value\":\"Services\"},{\"key\":\"listFilters\",\"value\":\"[]\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD7\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0),(4,'\/contact','todo',1,'Contact','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD4\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD3\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaD0\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD1\",\"propsData\":[{\"key\":\"text\",\"value\":\"Contact page text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD2\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0)","INSERT INTO `${p}Services` VALUES(1,'\/service-1','todo',1,'Service 1','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaD-\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCz\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCw\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCx\",\"propsData\":[{\"key\":\"text\",\"value\":\"Service1 description\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCy\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0),(2,'\/service-2','todo',1,'Service 2','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCv\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCu\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCr\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCs\",\"propsData\":[{\"key\":\"text\",\"value\":\"Service2 description\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCt\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0),(3,'\/service-3','todo',1,'Service 3','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCq\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCp\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaCm\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCn\",\"propsData\":[{\"key\":\"text\",\"value\":\"Service3 description\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaCo\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"\"}],\"children\":[]}]',0)","INSERT INTO `${p}files` (`fileName`,`baseDir`,`mime`,`friendlyName`,`createdAt`) VALUES('sample.jpg','','image\/jpg','',1637834587)"]