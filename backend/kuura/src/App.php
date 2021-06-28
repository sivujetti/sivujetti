<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\AppContext;
use KuuraCms\Page\PagesModule;
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
            new self,
            new PagesModule,
        ], function (AppContext $ctx, ServiceDefaults $defaults) use ($config): void {
            $ctx->config = $defaults->makeConfig($config);
            $ctx->db = $defaults->makeDb();
        }, $initialCtx ?? new AppContext, $router);
    }
    /**
     * @param \KuuraCms\AppContext $ctx
     */
    public function init(AppContext $ctx, $doPopulateCtxEarly): void {
        $ctx->router->on("*", function ($req, $_2, $next) use ($ctx) {
            $req->myData = new \stdClass;
            $ctx->db->open();
            $next();
        });
    }
}
