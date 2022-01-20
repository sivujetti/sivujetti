<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Pike\{Request, Response};

final class PageTypesController {
    /**
     * POST /api/page-types: Inserts new page type to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\PageType\PageTypeMigrator $migrator
     */
    public function createPageType(Request $req,
                                   Response $res,
                                   PageTypeMigrator $migrator): void {
        // @allow \Pike\PikeException
        $migrator->install($req->body);
        $res->status(201)->json(["ok" => "ok"]);
    }
}
