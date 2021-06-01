INSERT INTO `pages` VALUES
(1,'/','Basic site example','layout.full-width.tmpl.php'),
(2,'/company','Company','layout.full-width.tmpl.php'),
(3,'/services','Services','layout.with-sidebar.tmpl.php'),
(4,'','<pseudo>',''),
(5,'/contact','Contact','layout.full-width.tmpl.php');

INSERT INTO `blocks` VALUES
(1,'heading','main','auto',1),
(2,'paragraph','main','auto',1),
(3,'formatted-text','main','auto',1),

(4,'heading','main','auto',2),
(5,'paragraph','main','auto',2),
(6,'formatted-text','main','auto',2),

(7,'heading','main','auto',3),
(8,'paragraph','main','auto',3),
(9,'formatted-text','main','auto',3),
(10,'dynamic-listing','sidebar','auto',3),

(11,'paragraph','sidebar','auto',4),

(12,'heading','main','auto',5),
(13,'paragraph','main','auto',5),
(14,'formatted-text','main','auto',5);

INSERT INTO `blockProps` VALUES
(1,'text','Front page',1),
(2,'level','1',1),
(3,'text','Front page p1',2),
(4,'html','<pre>Some html 1</pre>',3),

(5,'text','Company',4),
(6,'level','1',4),
(7,'text','Company page p1',5),
(8,'html','<pre>Some html 2</pre>',6),

(9,'text','Services',7),
(10,'level','1',7),
(11,'text','Services p1',8),
(12,'html','<pre>Some html 3</pre>',9),
(13,'fetchFilters','{$all: {$eq: {entityType: "pages", id: $in: [foo]}}}',10),

(14,'text','Services sidebar p1',11),

(15,'text','Company',12),
(16,'level','1',12),
(17,'text','Company page p1',13),
(18,'html','<pre>Some html 2</pre>',14);
