INSERT INTO `theWebsite` VALUES
('My site','en','{}',0);

INSERT INTO `contentTypes` VALUES
(1,'Pages','["heading","paragraph"]',1),
(2,'Services','["heading","paragraph"]',1);

INSERT INTO `Pages` VALUES
(1,'/','Basic site example','layout.full-width.tmpl.php'),
(2,'/company','Company','layout.with-sidebar.tmpl.php'),
(3,'/services','Services','layout.with-sidebar.tmpl.php'),
(4,'','<pseudo>',''),
(5,'','<pseudo>',''),
(6,'/contact','Contact','layout.full-width.tmpl.php');

INSERT INTO `blocks` VALUES
-- home
(1,'heading','main','auto',1,NULL),
(2,'paragraph','main','auto',1,NULL),
(3,'formatted-text','main','auto',1,NULL),

-- company
(4,'heading','main','auto',2,NULL),
(5,'paragraph','main','auto',2,NULL),
(6,'heading','sidebar','auto',2,NULL),
(7,'paragraph','sidebar','auto',2,NULL),

-- services
(8,'heading','main','auto',3,NULL),
(9,'dynamic-listing','main','auto',3,'Services'),
(10,'heading','sidebar','auto',3,NULL),
(11,'paragraph','sidebar','auto',3,NULL),
-- services listing
(14,'heading','main','auto',4,NULL),
(15,'paragraph','main','auto',4,NULL),
(16,'heading','sidebar','auto',5,NULL),
(17,'paragraph','sidebar','auto',5,NULL),

-- contact
(12,'heading','main','auto',6,NULL),
(13,'paragraph','main','auto',6,NULL);

INSERT INTO `blockProps` VALUES
(1,'text','Front page',1),
(2,'level','1',1),
(3,'text','Front page p1',2),
(4,'html','<pre>Some html 1</pre>',3),

(5,'text','Company',4),
(6,'level','2',4),
(7,'text','Company page p1',5),
(8,'text','Sidebar1',6),
(9,'level','1',6),
(10,'text','text',7),

(11,'text','Services',8),
(12,'level','1',8),
(13,'fetchFilters','{"$all": {"$eq": {"contentType": "Services"}}}',9),
(14,'text','Sidebar2',10),
(15,'level','2',10),
(16,'text','text',11),

(20,'text','Service 1',14),
(21,'level','2',14),
(22,'text','Cats',15),
(23,'text','Service 2',16),
(24,'level','2',16),
(25,'text','Dogs',17),

(17,'text','Company',12),
(18,'level','1',12),
(19,'text','Company page p1',13);
