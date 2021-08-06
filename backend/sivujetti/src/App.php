<?php declare(strict_types=1);

namespace Sivujetti;

use Auryn\Injector;
use Sivujetti\Auth\ACL;
use Sivujetti\Block\BlocksModule;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ColumnsBlockType, HeadingBlockType, ParagraphBlockType,
                        SectionBlockType};
use Sivujetti\Page\PagesModule;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Plugin\Entities\Plugin;
use Sivujetti\TheWebsite\TheWebsiteRepository;
use Sivujetti\UserPlugin\{UserPluginAPI, UserPluginInterface};
use Sivujetti\UserSite\{UserSiteAPI, UserSiteInterface};
use Pike\{App as PikeApp, PikeException, Request, Response, Router, ServiceDefaults};

final class App {
    public const VERSION = "0.2.0";
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
        return new PikeApp([
            new self,
            new BlocksModule,
            new PagesModule,
        ], function (AppContext $ctx, ServiceDefaults $defaults) use ($config): void {
            $ctx->config = $defaults->makeConfig($config);
            $ctx->db = $defaults->makeDb();
            $ctx->storage = $ctx->storage ?? new SharedAPIContext;
            $ctx->storage->getDataHandle()->blockTypes = (object) [
                Block::TYPE_COLUMNS => new ColumnsBlockType,
                Block::TYPE_HEADING => new HeadingBlockType,
                Block::TYPE_PARAGRAPH => new ParagraphBlockType,
                Block::TYPE_SECTION => new SectionBlockType,
            ];
            $ctx->storage->getDataHandle()->validBlockRenderers = [
                "sivujetti:block-auto",
                "sivujetti:block-generic-wrapper"
            ];
        }, $initialCtx ?? new AppContext, $router);
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
            $req->myData = new \stdClass;
            $doRequireLogin = str_starts_with($req->path, "/api/") ||
                              str_starts_with($req->path, "/_edit/");
            if ($doRequireLogin && !$this->validateRequestMeta($req, $res)) return;
            $this->openDbAndLoadState();
            if ($doRequireLogin && !$this->checkRequestUserPermissions($req, $res)) return;
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
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @return bool $requestMetaWasOk
     * @throws \Pike\PikeException If the route definition (ctx->router->map) wasn't valid
     */
    private function validateRequestMeta(Request $req, Response $res): bool {
        $routeInfo = $req->routeInfo->myCtx;
        //
        if (($consumesStr = $routeInfo["consumes"] ?? "") &&
            !str_starts_with($req->header("Content-Type", "text/html"), $consumesStr)) {
            $res->status(415)->plain("Unexpected content-type");
            return false;
        }
        //
        $todoUserRole = ACL::ROLE_ADMIN;
        if (!$todoUserRole) {
            $res->status(401)->plain("Login required");
            return false;
        }
        //
        return true;
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @return bool $requestUserIsPermittedToAccessThisRoute
     * @throws \Pike\PikeException If the database returned invalid aclRulesJson
     */
    private function checkRequestUserPermissions(Request $req, Response $res): bool {
        $doThrowExceptions = (bool) (SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE);
        $acl = new ACL($doThrowExceptions);
        $theWebsite = $this->ctx->theWebsite;
        if (($rules = json_decode($theWebsite->aclRulesJson)) === null)
            throw new PikeException("Failed to parse acl rules",
                                    PikeException::BAD_INPUT);
        $acl->setRules($rules);
        $todoUserRole = ACL::ROLE_ADMIN;
        if (!$acl->can($todoUserRole, ...$req->routeInfo->myCtx["identifiedBy"])) {
            $res->status(403)->plain("Not permitted");
            return false;
        }
        //
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
        }
    }
    /**
     */
    private function loadSite(): void {
        $this->ctx->sivujettiSite = $this->instantiatePluginOrSite(null);
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
            return new $Ctor(new UserPluginAPI($plugin->name, $this->ctx->storage));
        return new $Ctor(new UserSiteAPI("site", $this->ctx->storage));
    }
}
