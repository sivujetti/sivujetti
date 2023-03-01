<?php declare(strict_types=1);

namespace Sivujetti\Boot;

use Pike\Db\{FluentDb};
use Pike\{AppConfig, Db, FileSystem, Injector, NativeSession, PikeException,
          Request, Router, Response};
use Pike\Auth\Authenticator;
use Pike\Auth\Defaults\DefaultCookieStorage;
use Pike\Defaults\DefaultUserRepository;
use Pike\Interfaces\{FileSystemInterface, SessionInterface};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, CodeBlockType, ColumnsBlockType,
                         GlobalBlockReferenceBlockType, HeadingBlockType, ImageBlockType,
                         ListingBlockType, MenuBlockType, PageInfoBlockType,
                         ParagraphBlockType, RichTextBlockType, SectionBlockType,
                         TextBlockType};
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Plugin\Entities\Plugin;
use Sivujetti\{SharedAPIContext};
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\TheWebsite\TheWebsiteRepository;
use Sivujetti\UserPlugin\{UserPluginAPI, UserPluginInterface};
use Sivujetti\UserSite\{UserSiteAPI, UserSiteInterface};

class BootModule {
    /** @var array<string, mixed> */
    protected array $config;
    /** @var \Pike\Injector */
    protected Injector $di;
    /** @var bool */
    private bool $essentialsLoaded = false;
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(array $config) {
        $this->config = $config;
    }
    /**
     * @param \Pike\Router $router
     * @param \Pike\Injector $di
     */
    public function init(Router $router, Injector $di): void {
        if (str_starts_with($di->make(Request::class)->path, "/plugins/")) {
            $this->loadEssentialsIfNotLoaded($di);
            $di->make(SharedAPIContext::class)->setAppPhase(SharedAPIContext::PHASE_READY_FOR_ROUTING);
        }
        $router->on("*", function ($req, $res, $next) {
            $req->myData = (object) ["user" => null];
            $devModeIsOn = (bool) (SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE);
            if (($error = $this->validateRouteContext($req, $devModeIsOn))) {
                if (!$devModeIsOn) { $res->plain("500")->status(500); return; }
                throw new PikeException($error, PikeException::BAD_INPUT);
            }
            if (!$this->validateRequestMeta($req, $res)) return;
            $next();
        });
    }
    /**
     * @param \Pike\Injector $di
     */
    public function beforeExecCtrl(Injector $di): void {
        $this->loadEssentialsIfNotLoaded($di);
        $this->di = $di;
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
        $ctx = $req->routeInfo->myCtx;
        if (($consumesStr = $ctx["consumes"] ?? "") &&
            !str_starts_with($req->header("Content-Type", "text/html"), $consumesStr)) {
            $res->status(415)->plain("Unexpected content-type");
            return false;
        }
        if (!($ctx["allowMissingRequestedWithHeader"] ?? false) &&
            $req->header("X-Requested-With", null) === null) {
            $res->status(400)->plain("X-Requested-With missing");
            return false;
        }
        return true;
    }
    /**
     * @param \Pike\Injector $di
     */
    protected function doLoadEssentials(Injector $di): void {
        $db = new Db($this->config);
        $di->share(new AppConfig($this->config));
        $di->share($db);
        $di->share(new FluentDb($db));
        $di->share(new Authenticator(
            fn() => new DefaultUserRepository($db),
            fn() => new NativeSession(autostart: false),
            fn() => new DefaultCookieStorage((object) ["req" => $di->make(Request::class),
                                                       "res" => $di->make(Response::class)]),
            userRoleCookieName: "maybeLoggedInUserRole",
            doUseRememberMe: true
        ));
    }
    /**
     * @param \Pike\Injector $di
     */
    private function loadEssentialsIfNotLoaded(Injector $di) {
        if ($this->essentialsLoaded) return;
        $this->doLoadEssentials($di);
        //
        $di->alias(FileSystemInterface::class, FileSystem::class);
        $di->alias(SessionInterface::class, NativeSession::class);
        //
        if (!$di->inspect(SharedAPIContext::class)[$di::I_SHARES]) {
            $apiCtx = new SharedAPIContext;
            $di->share($apiCtx);
        } else {
            $apiCtx = $di->make(SharedAPIContext::class);
        }
        //
        $doCreateBlockTypes = !isset($apiCtx->blockTypes);
        $blockTypes = $doCreateBlockTypes ? new BlockTypes : $apiCtx->blockTypes;
        $blockTypes->{Block::TYPE_BUTTON} = new ButtonBlockType;
        $blockTypes->{Block::TYPE_CODE} = new CodeBlockType;
        $blockTypes->{Block::TYPE_COLUMNS} = new ColumnsBlockType;
        $blockTypes->{Block::TYPE_GLOBAL_BLOCK_REF} = new GlobalBlockReferenceBlockType;
        $blockTypes->{Block::TYPE_HEADING} = new HeadingBlockType;
        $blockTypes->{Block::TYPE_IMAGE} = new ImageBlockType;
        $blockTypes->{Block::TYPE_LISTING} = new ListingBlockType;
        $blockTypes->{Block::TYPE_MENU} = new MenuBlockType;
        $blockTypes->{Block::TYPE_PAGE_INFO} = new PageInfoBlockType;
        $blockTypes->{Block::TYPE_PARAGRAPH} = new ParagraphBlockType;
        $blockTypes->{Block::TYPE_RICH_TEXT} = new RichTextBlockType;
        $blockTypes->{Block::TYPE_SECTION} = new SectionBlockType;
        $blockTypes->{Block::TYPE_TEXT} = new TextBlockType;
        if ($doCreateBlockTypes) $apiCtx->blockTypes = $blockTypes;
        $di->share($blockTypes);
        //
        $apiCtx->blockRenderers = array_merge($apiCtx->blockRenderers, [
            ["fileId" => "sivujetti:block-auto", "friendlyName" => null, "associatedWith" => null], // Text, Button etc.
            ["fileId" => "sivujetti:block-generic-wrapper", "friendlyName" => null, "associatedWith" => null], // Columns, Section
            ["fileId" => "sivujetti:block-listing-pages-default", "friendlyName" => "Pages listing", "associatedWith" => "*"],
            ["fileId" => "sivujetti:block-menu", "friendlyName" => null, "associatedWith" => null],
        ]);

        //
        $fluentDb = $di->make(FluentDb::class);
        $fluentDb->getDb()->open($this->config["db.driver"] === "sqlite"
            ? [\PDO::ATTR_EMULATE_PREPARES => 0]
            : [\PDO::ATTR_EMULATE_PREPARES => 0, \PDO::MYSQL_ATTR_INIT_COMMAND => "SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE"]
        );
        $apiCtx = $di->make(SharedAPIContext::class);
        if (!($theWebsite = TheWebsiteRepository::fetchActive($fluentDb)))
            throw new PikeException("Site not installed", 301010);
        if (empty($theWebsite->pageTypes) || $theWebsite->pageTypes[0]->name !== PageType::PAGE)
            throw new PikeException("Invalid database state", 301010);
        $router = $di->make(Router::class);
        $this->instantiateSite($apiCtx, $router);
        $this->instantiatePlugins($apiCtx, $router, $theWebsite);
        $di->share($theWebsite);

        $this->essentialsLoaded = true;
    }
    /**
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Pike\Router $router
     */
    private function instantiateSite(SharedAPIContext $apiCtx,
                                     Router $router): void {
        $apiCtx->userSite = $this->instantiatePluginOrSite(null, $apiCtx, $router);
    }
    /**
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Pike\Router $router
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    private function instantiatePlugins(SharedAPIContext $apiCtx,
                                        Router $router,
                                        TheWebsite $theWebsite): void {
        $instances =& $apiCtx->userPlugins; // Note: reference
        foreach ($theWebsite->plugins as $fromDb) {
            if (array_key_exists($fromDb->name, $instances)) continue;
            $instances[$fromDb->name] = $this->instantiatePluginOrSite($fromDb, $apiCtx, $router);
        }
    }
    /**
     * @param ?\Sivujetti\Plugin\Entities\Plugin $plugin
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Pike\Router $router
     * @return \Sivujetti\UserSite\UserSiteInterface|\Sivujetti\UserPlugin\UserPluginInterface
     */
    private function instantiatePluginOrSite(?Plugin $plugin,
                                             SharedAPIContext $apiCtx,
                                             Router $router): UserSiteInterface|UserPluginInterface {
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
            return new $Ctor(new UserPluginAPI($plugin->name, $apiCtx, $router));
        return new $Ctor(new UserSiteAPI("site", $apiCtx));
    }
}
