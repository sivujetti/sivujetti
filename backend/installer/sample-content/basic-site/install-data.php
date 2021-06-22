<?php

return [
    'theWebsite' => ['My site','en','{}',0],
    'pageTypes' => [
        [1,'Pages','[{"blockType":"heading","initialData":{"level":2}},{"blockType":"paragraph","initialData":{}}]',1],
        [2,'Services','[{"blockType":"heading","initialData":{"level":2}},{"blockType":"paragraph","initialData":{}}]',1],
    ],
    'pages' => [
        [1,'/','1',1,'Basic site example','layout.default.tmpl.php',0,1],
        [2,'/company','2',1,'Company','layout.default.tmpl.php',0,1],
        [3,'/services','3',1,'Services','layout.default.tmpl.php',0,1],
        [4,'','4',1,'','',0,2],
        [5,'','5',1,'','',0,2],
        [6,'/contact','6',1,'Contact','layout.default.tmpl.php',0,1],
    ],
    'blocks' => [
        ['data' => [1,'','section','main','kuura:generic-wrapper',1,NULL],
         'props' => [[1,'cssClass','light',1]],
         'children' => [
             ['data' => [2,'1/','heading','<inner>','kuura:auto',1,NULL],
              'props' => [[2,'level','1',2],
                          [3,'text','Front page',2],],
              'children' => []],
             ['data' => [3,'1/','paragraph','<inner>','kuura:auto',1,NULL],
              'props' => [[4,'text','Front page p1',3],],
              'children' => []],
         ]],
        ['data' => [4,'','heading','main','kuura:auto',2,NULL],
         'props' => [[5,'text','Company',4],
                     [6,'level','2',4],],
         'children' => []],
        ['data' => [5,'','paragraph','main','kuura:auto',2,NULL],
         'props' => [[7,'text','Company page p1',5]],
         'children' => []],
        ['data' => [6,'','heading','sidebar','kuura:auto',2,NULL],
         'props' => [[8,'text','Sidebar1',6],
                     [9,'level','1',6],],
         'children' => []],
        ['data' => [7,'','paragraph','sidebar','kuura:auto',2,NULL],
         'props' => [[10,'text','text',7]],
         'children' => []],
        ['data' => [8,'','columns','main','kuura:generic-wrapper',3,NULL],
         'props' => [[11,'foo','bar',8]],
         'children' => [
             ['data' => [9,'8/','section','<inner>','kuura:generic-wrapper',3,NULL],
              'props' => [[12,'cssClass','light',9],],
              'children' => [
                  ['data' => [10,'8/9/','heading','<inner>','kuura:auto',3,NULL],
                   'props' => [[13,'text','Services',10],
                               [14,'level','1',10],],
                   'children' => []],
                  ['data' => [11,'8/9/','dynamic-listing','<inner>','kuura:auto',3,'Services'],
                   'props' => [[15,'fetchFilters','{"$all": {"$eq": {"pageType": "Services"}}}',11],],
                   'children' => []],
              ]],
             ['data' => [12,'8/','section','<inner>','kuura:generic-wrapper',3,NULL],
              'props' => [[16,'cssClass','aside-column',12],],
              'children' => [
                  ['data' => [13,'8/12/','heading','<inner>','kuura:auto',3,NULL],
                   'props' => [[17,'text','Sidebar2',13],
                               [18,'level','2',13],],
                   'children' => []],
                  ['data' => [14,'8/12/','paragraph','<inner>','kuura:auto',3,NULL],
                   'props' => [[19,'text','text',14],],
                   'children' => []],
              ]],
         ]],
        ['data' => [15,'','heading','main','kuura:auto',4,NULL],
         'props' => [[20,'text','Service 1',15],
                     [21,'level','2',15],],
         'children' => []],
        ['data' => [16,'','paragraph','main','kuura:auto',4,NULL],
         'props' => [[22,'text','Cats',16],],
         'children' => []],
        ['data' => [17,'','heading','sidebar','kuura:auto',5,NULL],
         'props' => [[23,'text','Service 2',17],
                     [24,'level','2',17],],
         'children' => []],
        ['data' => [18,'','paragraph','sidebar','kuura:auto',5,NULL],
         'props' => [[25,'text','Dogs',18],],
         'children' => []],
        ['data' => [19,'','heading','main','kuura:auto',6,NULL],
         'props' => [[26,'text','Company',19],
                     [27,'level','1',19],],
         'children' => []],
        ['data' => [20,'','paragraph','main','kuura:auto',6,NULL],
         'props' => [[28,'text','Company page p1',20],],
         'children' => []],
        ['data' => [21,'','menu','<layout>','kuura:menu',1,'Main menu'],
         'props' => [[29,'tree','[{"id":1,"url":"/","text":"Home","children":[]},{"id":2,"url":"/company","text":"Company","children":[]},{"id":3,"url":"/services","text":"Services","children":[]},{"id":3,"url":"/contact","text":"Contact","children":[]}]',21],
                     [30,'doAddTopLevelPagesAutomatically','yes',21],
                     [31,'treeStart','',21],
                     [32,'itemStart','',21],],
         'children' => []],
        ['data' => [22,'','paragraph','<layout>','kuura:auto',1,'Footer text'],
         'props' => [[33,'text','© My site 2021',22],],
         'children' => []]
    ],
];
