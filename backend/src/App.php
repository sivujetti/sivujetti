<?php declare(strict_types=1);

namespace KuuraCms;

use Auryn\Injector;
use KuuraCms\Block\BlocksModule;
use KuuraCms\PageType\PageTypesModule;
use KuuraCms\Defaults\{ColumnsBlockType, DefaultsModule, FormattedTextBlockType,
                       HeadingBlockType, ListingBlockType, MenuBlockType, ParagraphBlockType,
                       SectionBlockType};
use KuuraCms\Defaults\ContactForm\ContactFormBlockType;
use KuuraCms\Entities\Block;
use KuuraCms\Entities\Plugin;
use KuuraCms\Page\PagesModule;
use KuuraCms\Plugin\PluginAPI;
use KuuraCms\Plugin\PluginInterface;
use KuuraCms\Website\{WebsiteAPI, WebsiteInterface};
use Pike\{App as PikeApp, ArrayUtils, FileSystem, PikeException, Router, ServiceDefaults};
use Pike\Interfaces\SessionInterface;

final class App {
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
            new BlocksModule,
            new DefaultsModule,
            new PageTypesModule,
            new PagesModule // Must be last because the * route
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
        if (str_starts_with($ctx->req->path, '/plugins')) {
            $doPopulateCtxEarly();
            $this->openDbAndLoadState();
        }
        $ctx->router->on('*', function ($req, $_2, $next) {
            $req->myData = new \stdClass;
            $this->openDbAndLoadState();
            $next();
        });
    }
    /**
     * @param \Auryn\Injector $di
     */
    public function alterDi(Injector $di): void {
        $this->ctx->storage->di = $di;
        $di->alias(SessionInterface::class, LazyStartingNativeSession::class);
        $di->share($this->ctx->storage);
        $di->share($this->ctx->site);
        $di->share($this->ctx->theWebsite);
    }
    /**
     * @access private
     */
    private function openDbAndLoadState(): void {
        if (!isset($this->ctx->site)) {
            $this->ctx->db->open();
            if (!($entity = TheWebsiteRepository::fetchActive($this->ctx->db)))
                throw new PikeException('Site not installed',
                                        PikeException::ERROR_EXCEPTION);
            $this->ctx->theWebsite = $entity;
            //
            $this->loadSite();
            $this->loadPlugins();
        }
    }
    /**
     * @access private
     */
    private function loadPlugins(): void {
        $paths = (new FileSystem)->readDir(KUURA_WORKSPACE_PATH . 'plugins', '*', GLOB_ONLYDIR);
        $mut = $this->ctx->theWebsite->plugins;
        foreach ($paths as $path) {
            $clsName = substr($path, strrpos($path, '/') + 1);
            if (!ArrayUtils::findByKey($mut, $clsName, 'name')) {
                $plugin = new Plugin;
                $plugin->name = $clsName;
                $plugin->isInstalled = true;
                $mut[] = $plugin;
            }
        }
        $d = $this->ctx->storage->getDataHandle();
        $d->installedPlugins = [];
        foreach ($mut as $plugin) {
            if ($plugin->isInstalled) {
                $p = $this->instantiatePluginOrSite($plugin);
                $p->foo($this->ctx->router);
                $d->installedPlugins[] = $p;
            }
        }
    }
    /**
     * @access private
     */
    private function loadSite(): void {
        $data = $this->ctx->storage->getDataHandle();
        $data->blockTypes = [
            Block::TYPE_COLUMNS => fn() => new ColumnsBlockType,
            Block::TYPE_CONTACT_FORM => fn() => new ContactFormBlockType,
            Block::TYPE_FORMATTED_TEXT => fn() => new FormattedTextBlockType,
            Block::TYPE_HEADING => fn() => new HeadingBlockType,
            Block::TYPE_LISTING => fn() => new ListingBlockType,
            Block::TYPE_MENU => fn() => new MenuBlockType,
            Block::TYPE_PARAGRAPH => fn() => new ParagraphBlockType,
            Block::TYPE_SECTION => fn() => new SectionBlockType,
        ];
        $data->pageTypes = $this->ctx->theWebsite->pageTypes;
        $this->ctx->site = $this->instantiatePluginOrSite(null);
    }
    /**
     * @access private
     */
    private function instantiatePluginOrSite(?Plugin $plugin): WebsiteInterface|PluginInterface {
        $isPlugin = $plugin !== null;
        $Ctor = $isPlugin
            ? "KuuraPlugins\\{$plugin->name}\\{$plugin->name}"
            : 'KuuraSite\\Site';
        if (!class_exists($Ctor))
            throw new PikeException($isPlugin ? "\"{$Ctor}\" missing" : "Main plugin class \"{$Ctor}\" missing",
                                    PikeException::BAD_INPUT);
        if (!array_key_exists($isPlugin ? PluginInterface::class : WebsiteInterface::class,
                              class_implements($Ctor, false)))
            throw new PikeException($isPlugin ? ("A plugin (\"{$Ctor}\") must implement " . PluginInterface::class)
                                              : ("Site.php (\"{$Ctor}\") must implement " . WebsiteInterface::class),
                                    PikeException::BAD_INPUT);
        if ($isPlugin)
            return new $Ctor(new PluginAPI($plugin->name, $this->ctx->storage));
        return new $Ctor(new WebsiteAPI('site', $this->ctx->storage));
    }
}
