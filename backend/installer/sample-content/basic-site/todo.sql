-- todo use StorageStrategy -abstraction

INSERT INTO `theWebsite` VALUES
('My site','en','{}',0);

INSERT INTO `pageTypes` VALUES
(1,'Pages','[{"blockType":"heading","initialData":{"level":2}},{"blockType":"paragraph","initialData":{}}]',1),
(2,'Services','[{"blockType":"heading","initialData":{"level":2}},{"blockType":"paragraph","initialData":{}}]',1);

INSERT INTO `pages` VALUES
(1,'/','1',1,'Basic site example','layout.default.tmpl.php',0,1),
(2,'/company','2',1,'Company','layout.default.tmpl.php',0,1),
(3,'/services','3',1,'Services','layout.default.tmpl.php',0,1),
(4,'','4',1,'','',0,2),
(5,'','5',1,'','',0,2),
(6,'/contact','6',1,'Contact','layout.default.tmpl.php',0,1);

INSERT INTO `blocks` VALUES
-- home
(1,'','section','main','kuura:generic-wrapper',1,NULL),
(2,'1/','heading','<inner>','kuura:auto',1,NULL),
(3,'1/','paragraph','<inner>','kuura:auto',1,NULL),

-- company
(4,'','heading','main','kuura:auto',2,NULL),
(5,'','paragraph','main','kuura:auto',2,NULL),
(6,'','heading','sidebar','kuura:auto',2,NULL),
(7,'','paragraph','sidebar','kuura:auto',2,NULL),

-- services
(8,'','columns','main','kuura:generic-wrapper',3,NULL),
(9,'8/','section','<inner>','kuura:generic-wrapper',6,NULL),
(10,'8/9/','heading','<inner>','kuura:auto',6,NULL),
(11,'8/9/','dynamic-listing','<inner>','kuura:auto',6,'Services'),
(12,'8/','section','<inner>','kuura:generic-wrapper',6,NULL),
(13,'8/12/','heading','<inner>','kuura:auto',6,NULL),
(14,'8/12/','paragraph','<inner>','kuura:auto',6,NULL),
-- services listing
(15,'','heading','main','kuura:auto',4,NULL),
(16,'','paragraph','main','kuura:auto',4,NULL),
(17,'','heading','sidebar','kuura:auto',5,NULL),
(18,'','paragraph','sidebar','kuura:auto',5,NULL),

-- contact
(19,'','heading','main','kuura:auto',6,NULL),
(20,'','paragraph','main','kuura:auto',6,NULL),

-- Page layouts
(21,'','menu','<layout>','kuura:menu',1, -- pageId ??
'Main menu'),
(22,'','paragraph','<layout>','kuura:auto',1,'Footer text');

INSERT INTO `blockProps` VALUES
(1,'cssClass','light',1),
(2,'level','1',2),
(3,'text','Front page',2),
(4,'text','Front page p1',3),

(5,'text','Company',4),
(6,'level','2',4),
(7,'text','Company page p1',5),
(8,'text','Sidebar1',6),
(9,'level','1',6),
(10,'text','text',7),

(11,'foo','bar',8),
(12,'cssClass','light',9),
(13,'text','Services',10),
(14,'level','1',10),
(15,'fetchFilters','{"$all": {"$eq": {"pageType": "Services"}}}',11),
(16,'cssClass','aside-column',12),
(17,'text','Sidebar2',13),
(18,'level','2',13),
(19,'text','text',14),

(20,'text','Service 1',15),
(21,'level','2',15),
(22,'text','Cats',16),
(23,'text','Service 2',17),
(24,'level','2',17),
(25,'text','Dogs',18),

(26,'text','Company',19),
(27,'level','1',19),
(28,'text','Company page p1',20),

(29,'tree','[{"id":1,"url":"/","text":"Home","children":[]},{"id":2,"url":"/company","text":"Company","children":[]},{"id":3,"url":"/services","text":"Services","children":[]},{"id":3,"url":"/contact","text":"Contact","children":[]}]',21),
(30,'doAddTopLevelPagesAutomatically','yes',21),
(31,'treeStart','',21),
(32,'itemStart','',21),
(33,'text','© My site 2021',22);
