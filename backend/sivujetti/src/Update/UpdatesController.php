<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\{Request, Response};

final class UpdatesController {
    /**
     * PUT /api/update/core: tries to update Sivujetti from App::VERSION to
     * $req->body->toVersion.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Update\Updater $updater
     */
    public function tryToUpdateCore(Request $req,
                                    Response $res,
                                    Updater $updater): void {
        $code = $updater->updateCore($req->body->toVersion ?? "<none-provided>");
        if ($code === Updater::RESULT_BAD_INPUT) {
            $res->status(400)->json([$updater->getLastError()]);
        } elseif ($code === Updater::RESULT_ALREADY_IN_PROGRESS ||
                  $code === Updater::RESULT_OK) {
            $res->json(["ok" => "ok", "detailsCode" => $code]);
        } else {
            $res->status(500)->json(["ok" => "err", "detailsCode" => $code]);
        }
    }
}
