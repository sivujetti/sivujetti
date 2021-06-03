<?php declare(strict_types=1);

namespace KuuraCms\ContentType;

use KuuraCms\Entities\TheWebsite;
use Pike\{ArrayUtils, Request, Response};

final class ContentTypesController {
    public function getContentTypes(Request $req, Response $res, TheWebsite $theWebsite): void {
        if ($req->params->filters !== 'listable')
            throw new \RuntimeException('dos');
        $res->json(ArrayUtils::filterByKey($theWebsite->contentTypes,
                                           true,
                                           'isListable')->getArrayCopy());
    }
}
