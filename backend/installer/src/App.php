<?php declare(strict_types=1);

namespace KuuraCms\Installer;

use KuuraCms\AppContext;
use Pike\{App as PikeApp, Router, ServiceDefaults};

final class App {
    /**
     * @param array|object|null $config
     * @param ?\KuuraCms\AppContext $initialCtx = null
     * @param ?\Pike\Router $router = null
     * @return \Pike\App
     */
    public static function create($config = null,
                                  ?AppContext $initialCtx = null,
                                  ?Router $router = null): PikeApp {
        return new PikeApp([
            new Module,
        ], function (AppContext $ctx, ServiceDefaults $defaults) use ($config): void {
            $ctx->config = $defaults->makeConfig($config);
            $ctx->db = $defaults->makeDb();
        }, $initialCtx ?? new AppContext, $router);
    }
}
