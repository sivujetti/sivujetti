<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\{ArrayUtils, PikeException, Request, Response};
use Sivujetti\JsonUtils;
use Sivujetti\TheWebsite\Entities\TheWebsite;

/**
 * @psalm-import-type Packge from \Sivujetti\Update\Updater
 */
final class UpdatesController {
    /**
     * PUT /api/updates/begin: tries to start the update process.
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\Update\Updater $updater
     */
    public function beginUpdates(Response $res, Updater $updater): void {
        $code = $updater->beginUpdates();
        if ($code === Updater::RESULT_PRECONDITION_FAILED) {
            $res->json(["ok" => "err", "detailsCode" => $code, "details" => $updater->getLastErrors()]);
        } elseif ($code === Updater::RESULT_OK || $code === Updater::RESULT_ALREADY_IN_PROGRESS) {
            $res->json(["ok" => "ok", "detailsCode" => $code]);
        } else {
            $res->status(500)->json(["ok" => "err", "detailsCode" => $code]);
        }
    }
    /**
     * POST /api/updates/[w:packageName]/download: tries to download $req->params->packageName
     * from the remote update server (dl*.sivujetti.org).
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Update\Updater $updater
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function downloadUpdate(Request $req, Response $res, Updater $updater, TheWebsite $theWebsite): void {
        [$arr, $idx] = self::findPackage($req->params->packageName, $theWebsite->pendingUpdatesJson);
        if ($idx < 0) throw new PikeException("No such package", PikeException::BAD_INPUT);

        $code = $updater->downloadUpdate($arr[$idx]->name);

        if ($code === Updater::RESULT_BAD_INPUT) {
            $res->status(400)->json($updater->getLastErrors());
        } elseif ($code === Updater::RESULT_OK) {
            $res->json(["ok" => "ok", "detailsCode" => $code]);
        } else {
            $res->status(500)->json(["ok" => "err", "detailsCode" => $code]);
        }
    }
    /**
     * PUT /api/updates/[w:packageName]/install: tries to install downloaded package
     * $req->params->packageName.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Update\Updater $updater
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function installUpdate(Request $req, Response $res, Updater $updater, TheWebsite $theWebsite): void {
        [$arr, $idx] = self::findPackage($req->params->packageName, $theWebsite->pendingUpdatesJson);
        if ($idx < 0) throw new PikeException("No such package", PikeException::BAD_INPUT);

        $code = $updater->installUpdate($arr[$idx]);

        if ($code === Updater::RESULT_BAD_INPUT) {
            $res->status(400)->json($updater->getLastErrors());
        } elseif ($code === Updater::RESULT_OK) {
            $res->json(["ok" => "ok", "detailsCode" => $code]);
        } else {
            $res->status(500)->json(["ok" => "err", "detailsCode" => $code]);
        }
    }
    /**
     * PUT /api/updates/finish: tries to finish up the update process.
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\Update\Updater $updater
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function finishUpdates(Response $res, Updater $updater, TheWebsite $theWebsite): void {
        $arr = self::getPackages($theWebsite->pendingUpdatesJson);
        $code = $updater->finishUpdates($arr);
        $res->json(["ok" => "ok", "detailsCode" => $code]);
    }
    /**
     * PUT /api/updates/core|some-plugin: tries to update Sivujetti or plugin from
     * App::VERSION to $req->body->toVersion.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Update\Updater $updater
     */
    public function tryToUpdate(Request $req,
                                Response $res,
                                Updater $updater): void {
        $toVersion = $req->body->toVersion ?? "<none-provided>";
        $code = $req->params->what === "core"
            ? throw new \RuntimeException("")
            : $updater->updatePlugin($req->params->what, $toVersion);
        if ($code === Updater::RESULT_BAD_INPUT) {
            $res->status(400)->json($updater->getLastErrors());
        } elseif ($code === Updater::RESULT_ALREADY_IN_PROGRESS ||
                  $code === Updater::RESULT_OK) {
            $res->json(["ok" => "ok", "detailsCode" => $code]);
        } else {
            $res->status(500)->json(["ok" => "err", "detailsCode" => $code]);
        }
    }
    /**
     * @param string $packageName "sivujetti-0.16.0", "JetForms-0.16.0"
     * @param ?string $pendingUpdatesJson
     * @psalm-return array{0: Package[], 1: int} [$packages, $packageIdx]
     */
    private static function findPackage(string $packageName, ?string $pendingUpdatesJson): array {
        $arr = self::getPackages($pendingUpdatesJson);
        return [$arr, $arr ? ArrayUtils::findIndexByKey($arr, $packageName, "name") : -1];
    }
    /**
     * @param ?string $pendingUpdatesJson
     * @psalm-return Package[]
     */
    private static function getPackages(?string $pendingUpdatesJson): array {
        return $pendingUpdatesJson ? JsonUtils::parse($pendingUpdatesJson) : [];
    }
}
