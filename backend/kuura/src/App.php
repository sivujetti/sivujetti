<?php declare(strict_types=1);

namespace KuuraCms;

use Auryn\Injector;
use KuuraCms\AppContext;
use KuuraCms\Page\PagesModule;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\Plugin\Entities\Plugin;
use KuuraCms\TheWebsite\TheWebsiteRepository;
use KuuraCms\UserPlugin\{UserPluginAPI, UserPluginInterface};
use KuuraCms\UserSite\{UserSiteAPI, UserSiteInterface};
use Pike\{App as PikeApp, PikeException, Router, ServiceDefaults};

final class App {
    /** @var \KuuraCms\AppContext */
    private AppContext $ctx;
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
            $ctx->storage = new SharedAPIContext;
        }, $initialCtx ?? new AppContext, $router);
    }

    /**
     * @param \KuuraCms\AppContext $ctx
     */
    public function init(AppContext $ctx, $doPopulateCtxEarly): void {
        $this->ctx = $ctx;
        if (str_starts_with($ctx->req->path, '/plugins/')) {
            $doPopulateCtxEarly();
            $this->openDbAndLoadState();
        }
        $ctx->router->on("*", function ($req, $_res, $next) {
            $req->myData = new \stdClass;
            $this->openDbAndLoadState();
            $next();
        });
    }
    /**
     * @param \Auryn\Injector $di
     */
    public function alterDi(Injector $di): void {
        $di->share($this->ctx->storage);
        $di->share($this->ctx->theWebsite);
    }
    /**
     * @access private
     */
    private function openDbAndLoadState(): void {
        if (!isset($this->ctx->theWebsite)) {
            $this->ctx->db->open();
            if (!($entity = TheWebsiteRepository::fetchActive($this->ctx->db)))
                throw new PikeException("Site not installed", 301010);
            if (empty($entity->pageTypes) || $entity->pageTypes[0]->name !== PageType::PAGE)
                throw new PikeException("Invalid database state", 301010);
            $this->ctx->theWebsite = $entity;
            $this->loadSite();
        }
    }
    /**
     * @access private
     */
    private function loadSite(): void {
        $this->ctx->kuuraSite = $this->instantiatePluginOrSite(null);
    }
    /**
     * @access private
     */
    private function instantiatePluginOrSite(?Plugin $plugin): UserSiteInterface|UserPluginInterface {
        $isPlugin = $plugin !== null;
        $Ctor = $isPlugin
            ? "SitePlugins\\{$plugin->name}\\{$plugin->name}"
            : "MySite\\Site";
        if (!class_exists($Ctor))
            throw new PikeException(!$isPlugin ? "\"{$Ctor}\" missing" : "Main plugin class \"{$Ctor}\" missing",
                                    PikeException::BAD_INPUT);
        if (!array_key_exists($isPlugin ? UserPluginInterface::class : UserSiteInterface::class,
                              class_implements($Ctor, false)))
            throw new PikeException($isPlugin ? ("A plugin (\"{$Ctor}\") must implement " . UserPluginInterface::class)
                                              : ("Site.php (\"{$Ctor}\") must implement " . UserSiteInterface::class),
                                    PikeException::BAD_INPUT);
        if ($isPlugin)
            return new $Ctor(new UserPluginAPI($plugin->name, $this->ctx->storage));
        return new $Ctor(new UserSiteAPI("site", $this->ctx->storage));
    }
}
