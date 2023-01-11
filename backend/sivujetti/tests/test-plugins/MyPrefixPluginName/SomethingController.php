<?php declare(strict_types=1);

namespace SitePlugins\MyPrefixPluginName;

use Pike\Response;

final class SomethingController {
    public function getSomething(Response $res): void {
        $res->json([]);
    }
    public function updateSomething(Response $res): void {
        $res->json(["ok" => "ok"]);
    }
    public function getSomething2(Response $res): void {
        $res->json([]);
    }
}
