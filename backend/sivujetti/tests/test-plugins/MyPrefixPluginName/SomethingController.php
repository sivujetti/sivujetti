<?php declare(strict_types=1);

namespace SitePlugins\MyPrefixPluginName;

use Pike\Response;

final class SomethingController {
    public function getSomething(Response $res): void {
        $res->json([]);
    }
}