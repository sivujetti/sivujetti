<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Page\PagesModule;
use Pike\{App as PikeApp, AppContext, Router, ServiceDefaults};

final class App {
    private $ctx; // tyyppi? 
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
            new PagesModule
        ], function (AppContext $ctx, ServiceDefaults $defaults) use ($config): void {
            $ctx->config = $defaults->makeConfig($config);
            $ctx->db = $defaults->makeDb();
        }, $initialCtx ?? new AppContext, $router);
    }
    /**
     * @param \Pike\AppContext $ctx
     */
    public function init(AppContext $ctx, $doPopulateCtxEarly): void {
        $this->ctx = $ctx;
        if (str_starts_with($ctx->req->path, '/plugins')) {
            $doPopulateCtxEarly();
            $this->openDb();
        }
        $ctx->router->on('*', function ($_1, $_2, $next) {
            $this->openDb();
            $next();
        });
    }
    /**
     * @access private
     */
    private function openDb(): void {
        if (!isset($this->ctx->site))
            $this->ctx->db->open();
    }
}
