<?php // ["INSERT INTO `${p}theWebsite` VALUES('Empty','en','US','My website','{\"resources\":{\"blocks\":{\"create\":2,\"renderOrView\":4},\"coreUpdates\":{\"checkAvailable\":2,\"install\":4},\"globalBlockTrees\":{\"create\":2,\"read\":4,\"updateBlocksOf\":8,\"update\":16},\"editMode\":{\"access\":2},\"layouts\":{\"list\":2,\"updateStructureOf\":4},\"pages\":{\"create\":2,\"list\":4,\"updateBlocksOf\":8,\"update\":16},\"pageTypes\":{\"create\":2,\"update\":4,\"delete\":8},\"themes\":{\"view\":2,\"updateGlobalStylesOf\":4,\"upsertBlockTypeScopedStyles\":8},\"uploads\":{\"view\":2,\"upload\":4}},\"userPermissions\":{\"2\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":30,\"editMode\":2,\"layouts\":6,\"pages\":30,\"pageTypes\":14,\"themes\":14,\"uploads\":6},\"4\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":30,\"editMode\":2,\"layouts\":6,\"pages\":30,\"themes\":14,\"uploads\":6},\"8\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":20,\"editMode\":2,\"layouts\":2,\"pages\":30,\"themes\":6,\"uploads\":6},\"16\":{\"editMode\":2,\"pages\":4}}}','{}',0,0)","INSERT INTO `${p}themes` VALUES('1','empty','[{\"name\":\"defaultTextColor\",\"friendlyName\":\"Text (default)\",\"value\":{\"type\":\"color\",\"value\":[\"44\",\"44\",\"44\",\"ff\"]}}]',1,'\/* -- .j-_body_ classes start -- *\/.j-_body_{margin:0;color:var(--defaultTextColor);}\/* -- .j-_body_ classes end -- *\/\/* -- .j-Paragraph classes start -- *\/\/* nothing *\/\/* -- .j-Paragraph classes end -- *\/\/* -- .j-Heading classes start -- *\/\/* nothing *\/\/* -- .j-Heading classes end -- *\/\/* -- .j-RichText classes start -- *\/\/* nothing *\/\/* -- .j-RichText classes end -- *\/\/* -- .j-Button classes start -- *\/\/* nothing *\/\/* -- .j-Button classes end -- *\/\/* -- .j-Image classes start -- *\/\/* nothing *\/\/* -- .j-Image classes end -- *\/\/* -- .j-Section classes start -- *\/.j-Section-unit-1 >[data-block-root]{max-width:1100px;margin:0 auto;padding:6rem 2rem;}\/* -- .j-Section classes end -- *\/\/* -- .j-Columns classes start -- *\/\/* nothing *\/\/* -- .j-Columns classes end -- *\/\/* -- .j-Listing classes start -- *\/\/* nothing *\/\/* -- .j-Listing classes end -- *\/\/* -- .j-Menu classes start -- *\/\/* nothing *\/\/* -- .j-Menu classes end -- *\/\/* -- .j-Code classes start -- *\/\/* nothing *\/\/* -- .j-Code classes end -- *\/')","INSERT INTO `${p}themeStyles` VALUES('[{\"title\":\"Default\",\"id\":\"default\",\"scss\":\"margin: 0;\\r\\ncolor: var(--defaultTextColor);\",\"generatedCss\":\".j-_body_{margin:0;color:var(--defaultTextColor);}\"}]','1','_body_'),('[]','1','Paragraph'),('[]','1','Heading'),('[]','1','RichText'),('[]','1','Button'),('[]','1','Image'),('[{\"title\":\"Default\",\"id\":\"unit-1\",\"scss\":\"> [data-block-root] {\\r\\n  max-width: 1100px;\\r\\n  margin: 0 auto;\\r\\n  padding: 6rem 2rem;\\r\\n}\",\"generatedCss\":\".j-Section-unit-1 >[data-block-root]{max-width:1100px;margin:0 auto;padding:6rem 2rem;}\"}]','1','Section'),('[]','1','Columns'),('[]','1','Listing'),('[]','1','Menu'),('[]','1','Code')","INSERT INTO `${p}pageTypes` VALUES(1,'Pages','\/pages','Page','Pages','','{\"ownFields\":[],\"blockFields\":[{\"type\":\"Paragraph\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"text\":\"Paragraph text\"},\"children\":[]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"New page\"}}}','1',0,1)","INSERT INTO `${p}globalBlockTrees` VALUES('1','Header','[{\"type\":\"Section\",\"title\":\"Header\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDR\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"j-Section-header\",\"children\":[{\"type\":\"Heading\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDT\",\"propsData\":[{\"key\":\"text\",\"value\":\"Heading\"},{\"key\":\"level\",\"value\":\"1\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Menu\",\"title\":\"\",\"renderer\":\"sivujetti:block-menu\",\"id\":\"EsmAW0--AnViMcwnIaDS\",\"propsData\":[{\"key\":\"tree\",\"value\":\"[{\\\\\"slug\\\\\":\\\\\"\\\\\\\/\\\\\",\\\\\"text\\\\\":\\\\\"Home\\\\\",\\\\\"id\\\\\":1,\\\\\"children\\\\\":[]}]\"},{\"key\":\"wrapStart\",\"value\":\"<nav><div>\"},{\"key\":\"wrapEnd\",\"value\":\"<\\\/div><\\\/nav>\"},{\"key\":\"treeStart\",\"value\":\"<ul class=\\\\\"level-{depth}\\\\\">\"},{\"key\":\"treeEnd\",\"value\":\"<\\\/ul>\"},{\"key\":\"itemStart\",\"value\":\"<li class=\\\\\"level-{depth}\\\\\"{current}>\"},{\"key\":\"itemAttrs\",\"value\":\"[]\"},{\"key\":\"itemEnd\",\"value\":\"<\\\/li>\"}],\"styleClasses\":\"\",\"children\":[]}]}]'),('2','Footer','[{\"type\":\"Section\",\"title\":\"Footer\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDP\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"j-Section-footer\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDQ\",\"propsData\":[{\"key\":\"text\",\"value\":\"Footer text\"}],\"styleClasses\":\"\",\"children\":[]}]}]')","INSERT INTO `${p}layouts` VALUES('1','Default','layout.default.tmpl.php','[{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"1\"},{\"type\":\"pageContents\"},{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"2\"}]')","INSERT INTO `${p}PagesCategories` VALUES(1,'\/uncategorized','uncategorized\/',1,'Uncategorized','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDO\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDL\",\"propsData\":[{\"key\":\"text\",\"value\":\"Uncategorized\"}],\"styleClasses\":\"\",\"children\":[]}]',0,1659349628,1659349628)","INSERT INTO `${p}Pages` VALUES(1,'\/','\/','[]',1,'Home page','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDK\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDJ\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"1\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"EsmAW0--AnViMcwnIaDG\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDH\",\"propsData\":[{\"key\":\"text\",\"value\":\"Home page text\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"EsmAW0--AnViMcwnIaDI\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"2\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1659349628,1659349628)"]