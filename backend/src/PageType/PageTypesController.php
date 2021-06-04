<?php declare(strict_types=1);

namespace KuuraCms\PageType;

use KuuraCms\Entities\TheWebsite;
use Pike\{ArrayUtils, Request, Response};

final class PageTypesController {
    public function getPageTypes(Request $req, Response $res, TheWebsite $theWebsite): void {
        if ($req->params->filter === 'listable') {
            $res->json(ArrayUtils::filterByKey($theWebsite->pageTypes,
                                               true,
                                               'isListable')->getArrayCopy());
            return;
        }
        $res->json(ArrayUtils::findByKey($theWebsite->pageTypes,
                                         $req->params->filter,
                                         'name'));
    }
}
