<?php // ["INSERT INTO `${p}theWebsite` VALUES('Empty','en','US','My website','{\"resources\":{\"blocks\":{\"create\":2,\"renderOrView\":4},\"coreUpdates\":{\"checkAvailable\":2,\"install\":4},\"globalBlockTrees\":{\"create\":2,\"read\":4,\"update\":8,\"upsertStylesOf\":16},\"editMode\":{\"access\":2},\"layouts\":{\"list\":2,\"updateStructureOf\":4},\"pages\":{\"create\":2,\"list\":4,\"updateBlocksOf\":8,\"update\":16,\"upsertStylesOf\":32},\"pageTypes\":{\"create\":2,\"update\":4,\"delete\":8},\"themes\":{\"view\":2,\"updateGlobalStylesOf\":4,\"upsertBlockTypeBaseStylesOf\":8},\"uploads\":{\"view\":2,\"upload\":4}},\"userPermissions\":{\"2\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":30,\"editMode\":2,\"layouts\":6,\"pages\":62,\"themes\":14,\"uploads\":6},\"4\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":14,\"editMode\":2,\"layouts\":2,\"pages\":26,\"themes\":6,\"uploads\":6},\"8\":{\"editMode\":2}}}','{}',0,0)","INSERT INTO `${p}themes` VALUES('1','empty','[{\"name\":\"defaultTextColor\",\"friendlyName\":\"Text (default)\",\"value\":{\"type\":\"color\",\"value\":[\"44\",\"44\",\"44\",\"ff\"]}}]',1,'\/* nothing *\/','\/* nothing *\/')","INSERT INTO `${p}pageTypes` VALUES(1,'Pages','\/pages','Page','Pages','','{\"ownFields\":[],\"blockFields\":[{\"type\":\"Paragraph\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"text\":\"Paragraph text\",\"cssClass\":\"\"},\"children\":[]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"New page\"}}}','1',0,1)","INSERT INTO `${p}globalBlocks` VALUES('1','Header','[{\"type\":\"Section\",\"title\":\"Header\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDR\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"header\"}],\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDT\",\"propsData\":[{\"key\":\"text\",\"value\":\"Heading\"},{\"key\":\"level\",\"value\":\"1\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]},{\"type\":\"Menu\",\"title\":\"\",\"renderer\":\"sivujetti:block-menu\",\"id\":\"EsmAW0--AnViMcwnIaDS\",\"propsData\":[{\"key\":\"tree\",\"value\":\"[{\\\\\"slug\\\\\":\\\\\"\\\\\\\/\\\\\",\\\\\"text\\\\\":\\\\\"Home\\\\\",\\\\\"id\\\\\":1,\\\\\"children\\\\\":[]}]\"},{\"key\":\"wrapStart\",\"value\":\"<nav><div>\"},{\"key\":\"wrapEnd\",\"value\":\"<\\\/div><\\\/nav>\"},{\"key\":\"treeStart\",\"value\":\"<ul class=\\\\\"level-{depth}\\\\\">\"},{\"key\":\"treeEnd\",\"value\":\"<\\\/ul>\"},{\"key\":\"itemStart\",\"value\":\"<li class=\\\\\"level-{depth}\\\\\"{current}>\"},{\"key\":\"itemAttrs\",\"value\":\"[]\"},{\"key\":\"itemEnd\",\"value\":\"<\\\/li>\"}],\"children\":[]}]}]'),('2','Footer','[{\"type\":\"Section\",\"title\":\"Footer\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDP\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"footer\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDQ\",\"propsData\":[{\"key\":\"text\",\"value\":\"Footer text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]}]')","INSERT INTO `${p}layouts` VALUES('1','Default','layout.default.tmpl.php','[{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"1\"},{\"type\":\"pageContents\"},{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"2\"}]')","INSERT INTO `${p}PagesCategories` VALUES(1,'\/uncategorized','uncategorized\/',1,'Uncategorized','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDO\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDL\",\"propsData\":[{\"key\":\"text\",\"value\":\"Uncategorized\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]',0)","INSERT INTO `${p}Pages` VALUES(1,'\/','\/',1,'Home page','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDK\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDJ\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDG\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"},{\"key\":\"cssClass\",\"value\":\"main\"}],\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDH\",\"propsData\":[{\"key\":\"text\",\"value\":\"Home page text\"},{\"key\":\"cssClass\",\"value\":\"\"}],\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDI\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"children\":[]}]',0,'[]')"]