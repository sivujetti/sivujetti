<?php // ["INSERT INTO `${p}theWebsite` VALUES('Empty','en','US','My website','{\"resources\":{\"blocks\":{\"create\":2,\"renderOrView\":4},\"coreUpdates\":{\"checkAvailable\":2,\"install\":4},\"globalBlockTrees\":{\"create\":2,\"read\":4,\"updateBlocksOf\":8},\"editMode\":{\"access\":2},\"layouts\":{\"list\":2,\"updateStructureOf\":4},\"pages\":{\"create\":2,\"list\":4,\"updateBlocksOf\":8,\"update\":16},\"pageTypes\":{\"create\":2,\"update\":4,\"delete\":8},\"reusableBranches\":{\"create\":2,\"list\":4},\"themes\":{\"view\":2,\"updateGlobalStylesOf\":4,\"upsertBlockTypeScopedVars\":8,\"upsertBlockTypeScopedCss\":16},\"theWebsite\":{\"updateBasicInfoOf\":2},\"uploads\":{\"view\":2,\"upload\":4}},\"userPermissions\":{\"2\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":14,\"editMode\":2,\"layouts\":6,\"pages\":30,\"pageTypes\":14,\"reusableBranches\":6,\"themes\":30,\"theWebsite\":2,\"uploads\":6},\"4\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":14,\"editMode\":2,\"layouts\":6,\"pages\":30,\"reusableBranches\":6,\"themes\":30,\"theWebsite\":2,\"uploads\":6},\"8\":{\"blocks\":6,\"coreUpdates\":6,\"globalBlockTrees\":12,\"editMode\":2,\"layouts\":2,\"pages\":30,\"reusableBranches\":6,\"themes\":14,\"theWebsite\":2,\"uploads\":6},\"16\":{\"editMode\":2,\"pages\":4}}}','{}','252adb04',0,0)","INSERT INTO `${p}themes` VALUES('1','empty','[\"_body_\",\"Paragraph\",\"Heading\",\"RichText\",\"Button\",\"Image\",\"Section\",\"Columns\",\"Listing\",\"Menu\",\"Code\"]','[]',1,'\/* -- .j-_body_ classes start -- *\/'||char(10)||'@layer body-unit { .j-_body_{--defaultBgColor:#fff;--defaultTextColor:#444;margin:0;background-color:var(--defaultBgColor);color:var(--defaultTextColor);}.j-_body_ >.j-Section>div{max-width:1100px;margin:0 auto;padding:6rem 2rem;} }'||char(10)||'\/* -- .j-_body_ classes end -- *\/'||char(10)||'\/* -- .j-Paragraph classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Paragraph classes end -- *\/'||char(10)||'\/* -- .j-Heading classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Heading classes end -- *\/'||char(10)||'\/* -- .j-RichText classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-RichText classes end -- *\/'||char(10)||'\/* -- .j-Button classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Button classes end -- *\/'||char(10)||'\/* -- .j-Image classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Image classes end -- *\/'||char(10)||'\/* -- .j-Section classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Section classes end -- *\/'||char(10)||'\/* -- .j-Columns classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Columns classes end -- *\/'||char(10)||'\/* -- .j-Listing classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Listing classes end -- *\/'||char(10)||'\/* -- .j-Menu classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Menu classes end -- *\/'||char(10)||'\/* -- .j-Code classes start -- *\/'||char(10)||'\/* nothing *\/'||char(10)||'\/* -- .j-Code classes end -- *\/'||char(10)||'',1671432935)","INSERT INTO `${p}themeStyles` VALUES('[{\"title\":\"Default\",\"id\":\"default\",\"scss\":\"\\\/\\\/ @exportAs(color)\\n--defaultBgColor: #fff;\\n\\\/\\\/ @exportAs(color)\\n--defaultTextColor: #444;\\n\\nmargin: 0;\\nbackground-color: var(--defaultBgColor);\\ncolor: var(--defaultTextColor);\\n\\n> .j-Section > div {\\n  max-width: 1100px;\\n  margin: 0 auto;\\n  padding: 1rem 2rem;\\n}\",\"generatedCss\":\"--defaultBgColor:#fff;--defaultTextColor:#444;margin:0;background-color:var(--defaultBgColor);color:var(--defaultTextColor);>.j-Section>div{max-width:1100px;margin:0 auto;padding:1rem 2rem;}\"}]','1','_body_'),('[]','1','Paragraph'),('[]','1','Heading'),('[]','1','RichText'),('[]','1','Button'),('[]','1','Image'),('[]','1','Section'),('[]','1','Columns'),('[]','1','Listing'),('[]','1','Menu'),('[]','1','Code')","INSERT INTO `${p}pageTypes` VALUES(1,'Pages','\/pages','Page','Pages','','{\"ownFields\":[],\"blockFields\":[{\"type\":\"Section\",\"title\":\"Main\",\"defaultRenderer\":\"sivujetti:block-generic-wrapper\",\"initialData\":{\"bgImage\":\"\",\"styleClasses\":\"\"},\"children\":[{\"type\":\"RichText\",\"title\":\"\",\"defaultRenderer\":\"sivujetti:block-auto\",\"initialData\":{\"html\":\"<p>Text...<\\\/p>\",\"styleClasses\":\"\"},\"children\":[]}]}],\"defaultFields\":{\"title\":{\"defaultValue\":\"New page\"}}}','1',0,1)","INSERT INTO `${p}globalBlockTrees` VALUES('-N70MetnzuwRQQXRbLtA','MainMenuBundle','[{\"type\":\"Section\",\"title\":\"MainMenuBundle\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"-NGLscvULGAiaK3mZq2T\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Menu\",\"title\":\"\",\"renderer\":\"sivujetti:block-menu\",\"id\":\"-NGLsd6CdPhYswmZHkOT\",\"propsData\":[{\"key\":\"tree\",\"value\":\"[{\\\"slug\\\":\\\"\\\\\\\/\\\",\\\"text\\\":\\\"Home\\\",\\\"id\\\":1,\\\"children\\\":[]}]\"},{\"key\":\"wrapStart\",\"value\":\"<nav {defaultAttrs}><div data-block-root>\"},{\"key\":\"wrapEnd\",\"value\":\"<\\\/div><\\\/nav>\"},{\"key\":\"treeStart\",\"value\":\"<ul class=\\\"level-{depth}\\\">\"},{\"key\":\"treeEnd\",\"value\":\"<\\\/ul>\"},{\"key\":\"itemStart\",\"value\":\"<li class=\\\"level-{depth}\\\"{current}>\"},{\"key\":\"itemAttrs\",\"value\":\"[]\"},{\"key\":\"itemEnd\",\"value\":\"<\\\/li>\"}],\"styleClasses\":\"\",\"children\":[]}]}]'),('-N70Mf0lsZIrvJAOarFb','Footer','[{\"type\":\"Section\",\"title\":\"Footer\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"-NGLsOGlKc3qw7kCRSOu\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsOKyFEfRDaejKxQf\",\"propsData\":[{\"key\":\"text\",\"value\":\"Footer text\"}],\"styleClasses\":\"\",\"children\":[]}]}]')","INSERT INTO `${p}layouts` VALUES('1','Default','layout.default.tmpl.php','[{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"-N70MetnzuwRQQXRbLtA\"},{\"type\":\"pageContents\"},{\"type\":\"globalBlockTree\",\"globalBlockTreeId\":\"-N70Mf0lsZIrvJAOarFb\"}]')","INSERT INTO `${p}PagesCategories` VALUES('-NGLsmQwm7aOSH-lS1-I','\/uncategorized','uncategorized\/',1,'Uncategorized','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsOClwIE5dZ7gdzb2\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsO-sLg5nXVVJF7Dg\",\"propsData\":[{\"key\":\"text\",\"value\":\"Uncategorized\"}],\"styleClasses\":\"\",\"children\":[]}]',0,1671432935,1671432935)","INSERT INTO `${p}Pages` VALUES('-NGLsmQwm7aOSH-lS1-J','\/','\/','[]',1,'Home page','{}','1','[{\"type\":\"PageInfo\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsNwt3b1rKdS6rauR\",\"propsData\":[{\"key\":\"overrides\",\"value\":\"[]\"}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsNsE9NodT9g6qBYe\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"-N70MetnzuwRQQXRbLtA\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]},{\"type\":\"Section\",\"title\":\"Main\",\"renderer\":\"sivujetti:block-generic-wrapper\",\"id\":\"-NGLsNfsJB4FRauRbznd\",\"propsData\":[{\"key\":\"bgImage\",\"value\":\"\"}],\"styleClasses\":\"\",\"children\":[{\"type\":\"Paragraph\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsNk-W54kP0xKza9S\",\"propsData\":[{\"key\":\"text\",\"value\":\"Home page text\"}],\"styleClasses\":\"\",\"children\":[]}]},{\"type\":\"GlobalBlockReference\",\"title\":\"\",\"renderer\":\"sivujetti:block-auto\",\"id\":\"-NGLsNnzGmWKjO0i1l57\",\"propsData\":[{\"key\":\"globalBlockTreeId\",\"value\":\"-N70Mf0lsZIrvJAOarFb\"},{\"key\":\"overrides\",\"value\":\"{}\"},{\"key\":\"useOverrides\",\"value\":0}],\"styleClasses\":\"\",\"children\":[]}]',0,1671432935,1671432935)"]