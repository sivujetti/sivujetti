<?php declare(strict_types=1);

namespace Sivujetti;

use Auryn\Injector;
use Sivujetti\Block\BlocksModule;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, ColumnsBlockType, GlobalBlockReferenceBlockType,
                         HeadingBlockType, ImageBlockType, MenuBlockType, PageInfoBlockType,
                         ParagraphBlockType, RichTextBlockType, SectionBlockType};
use Sivujetti\Page\PagesModule;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Plugin\Entities\Plugin;
use Sivujetti\TheWebsite\TheWebsiteRepository;
use Sivujetti\UserPlugin\{UserPluginAPI, UserPluginInterface};
use Sivujetti\UserSite\{UserSiteAPI, UserSiteInterface};
use Pike\{App as PikeApp, NativeSession, PikeException, Request, Response, Router, ServiceDefaults};
use Pike\Auth\Authenticator;
use Pike\Auth\Defaults\DefaultCookieStorage;
use Pike\Defaults\DefaultUserRepository;
use Sivujetti\Auth\AuthModule;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\GlobalBlockTree\GlobalBlockTreesModule;
use Sivujetti\Layout\LayoutsModule;
use Sivujetti\Update\UpdatesModule;
use Sivujetti\Upload\UploadsModule;

final class App {
    public const VERSION = "0.7.0";
    /** @var ?\Auryn\Injector */
    public static ?Injector $di;
    /** @var \Sivujetti\AppContext */
    private AppContext $ctx;
    /**
     * @param array|object|null $config
     * @param ?\Sivujetti\AppContext $initialCtx = null
     * @param ?\Pike\Router $router = null
     * @return \Pike\App
     */
    public static function create($config = null,
                                  ?AppContext $initialCtx = null,
                                  ?Router $router = null): PikeApp {
        $out = new PikeApp([
            new self,
            new AuthModule,
            new BlocksModule,
            new GlobalBlockTreesModule,
            new LayoutsModule,
            new UpdatesModule,
            new UploadsModule,
            new PagesModule,
        ], function (AppContext $ctx, ServiceDefaults $defaults) use ($config): void {
            $ctx->config = $defaults->makeConfig($config);
            $ctx->db = $defaults->makeDb();
            $ctx->auth = $defaults->makeAuth();
            $ctx->storage = $ctx->storage ?? new SharedAPIContext;
            $blockTypes = $ctx->storage->getDataHandle()->blockTypes ?? new BlockTypes;
            $blockTypes->{Block::TYPE_BUTTON} = new ButtonBlockType;
            $blockTypes->{Block::TYPE_COLUMNS} = new ColumnsBlockType;
            $blockTypes->{Block::TYPE_GLOBAL_BLOCK_REF} = new GlobalBlockReferenceBlockType;
            $blockTypes->{Block::TYPE_HEADING} = new HeadingBlockType;
            $blockTypes->{Block::TYPE_IMAGE} = new ImageBlockType;
            $blockTypes->{Block::TYPE_MENU} = new MenuBlockType;
            $blockTypes->{Block::TYPE_PAGE_INFO} = new PageInfoBlockType;
            $blockTypes->{Block::TYPE_PARAGRAPH} = new ParagraphBlockType;
            $blockTypes->{Block::TYPE_RICH_TEXT} = new RichTextBlockType;
            $blockTypes->{Block::TYPE_SECTION} = new SectionBlockType;
            $ctx->storage->getDataHandle()->blockTypes = $blockTypes;
            $ctx->storage->getDataHandle()->validBlockRenderers = [
                "sivujetti:block-auto", // Heading, Paragraph etc.
                "sivujetti:block-generic-wrapper", // Columns, Section
                "sivujetti:block-menu",
            ];
        }, $initialCtx ?? new AppContext, $router);
        $out->setServiceInstantiator(fn(AppContext $ctx) =>
            new class($ctx) extends ServiceDefaults {
                /**
                 * @inheritdoc
                 */
                public function makeAuth(): Authenticator {
                    return new Authenticator(
                        function ($_factory) { return new DefaultUserRepository($this->ctx->db); },
                        function ($_factory) { return new NativeSession(autostart: false); },
                        function ($_factory) { return new DefaultCookieStorage($this->ctx); },
                        userRoleCookieName: "maybeLoggedInUserRole",
                        doUseRememberMe: true
                    );
                }
            }
        );
        return $out;
    }
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx, $doPopulateCtxEarly): void {
        $this->ctx = $ctx;
        if (str_starts_with($ctx->req->path, "/plugins/")) {
            $doPopulateCtxEarly();
            $this->openDbAndLoadState();
        }
        $ctx->router->on("*", function ($req, $res, $next) {
            $req->myData = (object) ["user" => null];
            $devModeIsOn = (bool) (SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE);
            if (($error = $this->validateRouteContext($req, $devModeIsOn))) {
                if (!$devModeIsOn) { $res->plain("500")->status(500); return; }
                throw new PikeException($error, PikeException::BAD_INPUT);
            }
            if (!$this->validateRequestMeta($req, $res)) return;
            $this->openDbAndLoadState();
            $next();
        });
    }
    /**
     * @param \Auryn\Injector $di
     */
    public function alterDi(Injector $di): void {
        self::$di = $di;
        $di->share($this->ctx->storage);
        $di->share($this->ctx->storage->getDataHandle()->blockTypes);
        $di->share($this->ctx->theWebsite);
    }
    /**
     * @param \Pike\Request $req
     * @param bool $devModeIsOn
     * @return string $error or ""
     */
    private function validateRouteContext(Request $req, bool $devModeIsOn): string {
        $routeInfo = $req->routeInfo->myCtx ?? null;
        if (!is_array($routeInfo))
            return "All routes must define a context (router->map('A', 'B', <context>))";
        if ($devModeIsOn && !($routeInfo["skipAuth"] ?? false) && !is_array($routeInfo["identifiedBy"] ?? null))
            return "A route context must contain `identifiedBy` or `skipAuth`";
        return "";
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @return bool $requestMetaWasOk
     * @throws \Pike\PikeException If the route definition (ctx->router->map) wasn't valid
     */
    private function validateRequestMeta(Request $req, Response $res): bool {
        if (($consumesStr = $req->routeInfo->myCtx["consumes"] ?? "") &&
            !str_starts_with($req->header("Content-Type", "text/html"), $consumesStr)) {
            $res->status(415)->plain("Unexpected content-type");
            return false;
        }
        return true;
    }
    /**
     */
    private function openDbAndLoadState(): void {
        if (!isset($this->ctx->theWebsite)) {
            $this->ctx->db->open([\PDO::ATTR_EMULATE_PREPARES => 0]);
            if (!($entity = TheWebsiteRepository::fetchActive($this->ctx->db)))
                throw new PikeException("Site not installed", 301010);
            if (empty($entity->pageTypes) || $entity->pageTypes[0]->name !== PageType::PAGE)
                throw new PikeException("Invalid database state", 301010);
            $this->ctx->theWebsite = $entity;
            $this->loadSite();
            $this->loadPlugins();
        }
    }
    /**
     */
    private function loadSite(): void {
        $this->ctx->userSite = $this->instantiatePluginOrSite(null);
    }
    /**
     */
    private function loadPlugins(): void {
        foreach ($this->ctx->theWebsite->plugins as $plugin) {
            $_ignore = $this->instantiatePluginOrSite($plugin);
        }
    }
    /**
     * @param ?\Sivujetti\Plugin\Entities\Plugin $plugin
     * @return \Sivujetti\UserSite\UserSiteInterface|\Sivujetti\UserPlugin\UserPluginInterface
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
            return new $Ctor(new UserPluginAPI($plugin->name, $this->ctx->storage, $this->ctx->router));
        return new $Ctor(new UserSiteAPI("site", $this->ctx->storage));
    }
}
