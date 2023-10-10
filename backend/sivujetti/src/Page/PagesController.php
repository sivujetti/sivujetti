<?php declare(strict_types=1);

namespace Sivujetti\Page;

use MySite\Theme as UserTheme;
use Pike\{AppConfig, ArrayUtils, Db, PikeException, Request, Response, Validation};
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\{App, JsonUtils, PushIdGenerator, SharedAPIContext, Template, Translator};
use Sivujetti\Auth\ACL;
use Sivujetti\Block\{BlocksInputValidatorScanner};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{GlobalBlockReferenceBlockType, RenderAwareBlockTypeInterface};
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Layout\Entities\Layout;
use Sivujetti\Layout\LayoutsRepository;
use Sivujetti\Theme\Entities\Theme;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\Update\Updater;
use Sivujetti\UserTheme\UserThemeAPI;

final class PagesController {
    /**
     * GET /[anything]: Renders a page.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\Update\Updater $updater
     */
    public function renderPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo,
                               SharedAPIContext $apiCtx,
                               TheWebsite $theWebsite,
                               Updater $updater): void {
        $pcs = explode("/", $req->params->url, 3);
        [$pageTypeSlug, $slug] = count($pcs) > 2
            ? ["/" . $pcs[1], "/{$pcs[2]}"]
            : ["/" . PageType::SLUG_PAGE, "/{$pcs[1]}"];
        if (!($pageType = ArrayUtils::findByKey($theWebsite->pageTypes,
                                                $pageTypeSlug,
                                                "slug"))) {
            $res->status(404)->html("Unknown page type `" . Template::e($pageTypeSlug) . "`.");
            return;
        }
        if (!($page = $pagesRepo->getSingle($pageType,
                                            ["filters" => [["slug", $slug]]]))) {
            $res->status(404)->html("404");
            return;
        }
        if ($theWebsite->pendingUpdatesJson && $updater->hasUpdateJobBegun()) {
            $res->plain($theWebsite->lang === "fi"
                ? "Sivustoa huolletaan, palaamme hetken kuluttua."
                : "We're down for maintenance. Be right back.");
            return;
        }
        self::sendPageResponse($req, $res, $pagesRepo, $apiCtx, $theWebsite,
            $page, $pageType, false);
    }
    /**
     * GET /jet-login: Renders the login page.
     *
     * @param \Pike\Response $res
     * @param \Pike\AppConfig $config
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function renderLoginPage(Response $res, AppConfig $config, TheWebsite $theWebsite): void {
        $res
            ->header("Cache-Control", "no-store, must-revalidate")
            ->html((new WebPageAwareTemplate("sivujetti:page-auth-view.tmpl.php",
                                            assetUrlCacheBustStr: "v={$theWebsite->versionId}"))->render([
                "title" => "Login",
                "appName" => "login",
                "baseUrl" => WebPageAwareTemplate::makeUrl("/", true),
                "uiLang" => SIVUJETTI_UI_LANG,
                "dashboardUrl" => $config->get("app.dashboardUrl", ""),
            ]));
    }
    /**
     * GET /jet-reset-pass: Renders a password reset request page.
     *
     * @param \Pike\Response $res
     */
    public function renderRequestPassResetPage(Response $res): void {
        $res->html("This feature is currently disabled.");
    }


    //// public routes before, protected routes after this line ////////////////


    /**
     * GET /_edit: Renders the edit app.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\Auth\ACL $acl
     * @param \Pike\AppConfig $config
     * @param \Pike\Db $db
     * @param \Sivujetti\Update\Updater $updater
     */
    public function renderEditAppWrapper(Request $req,
                                         Response $res,
                                         TheWebsite $theWebsite,
                                         SharedAPIContext $apiCtx,
                                         ACL $acl,
                                         AppConfig $config,
                                         Db $db,
                                         Updater $updater): void {
        //
        $availableUpdatePackages = $updater->getAndSyncAvailablePackages(
            $theWebsite->pendingUpdatesJson,
            $theWebsite->newestCoreVersionLastChecked,
            $theWebsite->plugins
        );
        //
        $firstRunsParsed = json_decode($theWebsite->firstRunsJson, flags: JSON_THROW_ON_ERROR);
        $isFirstRun = ($firstRunsParsed->{$req->myData->user->id} ?? null) !== "y";
        if ($isFirstRun) {
            $firstRunsParsed->{$req->myData->user->id} = "y";
            $db->exec("UPDATE `\${p}theWebsite` SET `firstRuns`=?", [json_encode($firstRunsParsed)]);
        }
        //
        $userRole = $req->myData->user->role;
        $res->html((new WebPageAwareTemplate("sivujetti:edit-app-wrapper.tmpl.php",
                                             assetUrlCacheBustStr: "v={$theWebsite->versionId}"))->render([
            "userDefinedJsFiles" => $apiCtx->adminJsFiles,
            "dataToFrontend" => WebPageAwareTemplate::escInlineJs(json_encode((object) [
                "baseUrl" => WebPageAwareTemplate::makeUrl("/", true),
                "assetBaseUrl" => WebPageAwareTemplate::makeUrl("/", false),
                "website" => self::theWebsiteToRaw($theWebsite),
                "pageTypes" => $theWebsite->pageTypes->getArrayCopy(),
                "activeTheme" => (object) ["id" => $theWebsite->activeTheme->id],
                "blockRenderers" => $apiCtx->blockRenderers,
                "showGoToDashboardMode" => $config->get("app.showGoToDashboardMode", false),
                "dashboardUrl" => $config->get("app.dashboardUrl", ""),
                "userPermissions" => [
                    "canDoAnything" => $userRole === ACL::ROLE_SUPER_ADMIN,
                    "canEditGlobalStylesVisually" => $acl->can($userRole, "updateGlobalStylesOf", "themes"),
                    "canEditBlockStylesVisually" => $acl->can($userRole, "upsertBlockTypeScopedVars", "themes"),
                    "canEditBlockCss" => $acl->can($userRole, "upsertBlockTypeScopedCss", "themes"),
                    "canCreatePageTypes" => $acl->can($userRole, "create", "pageTypes"),
                    "canCreatePages" => $acl->can($userRole, "create", "pages"),
                    "canCreateReusableBranches" => $acl->can($userRole, "create", "reusableBranches"),
                    "canCreateGlobalBlockTrees" => $acl->can($userRole, "create", "globalBlockTrees"),
                    "canSpecializeGlobalBlocks" => $userRole <= ACL::ROLE_ADMIN,
                    "canEditTheWebsitesBasicInfo" => $acl->can($userRole, "updateBasicInfoOf", "theWebsite"),
                    "canListUploads" => $acl->can($userRole, "list", "uploads"),
                ],
                "userRole" => $userRole,
                "availableUpdatePackages" => $availableUpdatePackages,
            ], JSON_UNESCAPED_UNICODE)),
            "uiLang" => SIVUJETTI_UI_LANG,
            "isFirstRun" => $isFirstRun || $req->queryVar("first-run") !== null,
        ]));
    }
    /**
     * GET /api/_placeholder-page/[w:pageType]/[i:layoutId]?duplicate=[*:slug]: renders
     * a placeholder page for "Create|Duplicate page" functionality.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @throws \Pike\PikeException
     */
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          PagesRepository $pagesRepo,
                                          LayoutsRepository $layoutsRepo,
                                          SharedAPIContext $apiCtx,
                                          TheWebsite $theWebsite): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        $slugOfPageToDuplicate = $req->queryVar("duplicate");
        $page = null;
        //
        $page = $slugOfPageToDuplicate === null
            ? self::createEmptyPageWithBlocks($pageType, $layoutsRepo, $req->params->layoutId)
            : $pagesRepo->getSingle($pageType, ["filters" => [["slug", urldecode($slugOfPageToDuplicate)]]]);
        if (!$page) throw new \RuntimeException("No such page exist", PikeException::BAD_INPUT);
        //
        self::sendPageResponse($req, $res, $pagesRepo, $apiCtx, $theWebsite,
            $page, $pageType, true);
    }
    /**
     * POST /api/pages/[w:pageType]: Inserts a new page to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\Block\BlocksInputValidatorScanner $scanner
     */
    public function createPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo,
                               BlocksInputValidatorScanner $scanner): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        unset($req->body->createdAt);
        unset($req->body->lastUpdatedAt);
        [$validStorableBlocksJson, $errors, $errCode] = $scanner->createStorableBlocks(fn() => [], $req,
            isInsert: true);
        if ($errCode) {
            $res->status($errCode)->json($errors);
            return;
        }
        if (!isset($req->body->id)) $req->body->id = PushIdGenerator::generatePushId();
        [$numAffectedRows, $errors] = $pagesRepo->insert($pageType, $req->body,
            $validStorableBlocksJson);
        //
        if ($errors) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $res->status(201)->json(["ok" => "ok", "numAffectedRows" => $numAffectedRows,
                                "insertId" => $pagesRepo->getLastInsertId()]);
    }
    /**
     * POST /api/pages/[w:pageType]/quick: Inserts a new page with defaults to
     * the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     * @param \Sivujetti\Page\PagesRepository $pagesRepoOld
     * @param \Sivujetti\Block\BlocksInputValidatorScanner $scanner
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     */
    public function createPageQuick(Request $req,
                                    Response $res,
                                    PagesRepository2 $pagesRepo,
                                    PagesRepository $pagesRepoOld,
                                    BlocksInputValidatorScanner $scanner,
                                    LayoutsRepository $layoutsRepo): void {
        if (($errors = PageTypeValidator::withBaseRules(Validation::makeObjectValidator())->validate($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $pageType = $pagesRepoOld->getPageTypeOrThrow($req->params->pageType);
        $page = self::createEmptyPageWithBlocks($pageType, $layoutsRepo);
        if ($errors) throw new \RuntimeException("Shouldn't never happen.");
        $data = (object) [
            "id" => $req->body->id,
            "slug" => $req->body->slug,
            "path" => $req->body->path,
            "level" => substr_count($req->body->path, "/") - ($pageType->name === PageType::PAGE ? 0 : 1),
            "title" => $req->body->title,
            "meta" => JsonUtils::stringify($page->meta),
            "layoutId" => $page->layoutId,
            "blocks" => $scanner->createStorableBlocksWithoutValidating($page->blocks),
            "status" => Page::STATUS_PUBLISHED,
            "createdAt" => $page->createdAt,
            "lastUpdatedAt" => $page->lastUpdatedAt,
        ];
        foreach ($pageType->ownFields as $field) {
            $data->{$field->name} = $page->{$field->name};
        }
        //
        $numRows = $pagesRepo->insert($pageType)->values($data)->execute(return: "numRows");
        $ok = $numRows === 1;
        $res->status($ok ? 201 : 200)->json(["ok" => $ok ? "ok" : "err",
                                                "numAffectedRows" => $numRows]);
    }
    /**
     * GET /api/pages/[w:pageType]/[w:pageSlug]: Returns 200 & page with slug
     * $req->params->pageSlug !== "-" ? "/{$req->params->pageSlug}" : "/", or 404 & null.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     */
    public function getPage(Request $req,
                            Response $res,
                            PagesRepository2 $pagesRepo): void {
        $page = $pagesRepo->select($req->params->pageType, fields: ["@blocks"])
            ->where("slug = ?", $req->params->pageSlug !== "-" ? "/{$req->params->pageSlug}" : "/")
            ->fetch();
        $res->status($page ? 200 : 404)->json($page);
    }
    /**
     * GET /api/pages/w:pageType[?order-default]: Lists all $req->params->pageType's
     * pages.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     */
    public function listPages(Request $req,
                              Response $res,
                              PagesRepository2 $pagesRepo): void {
        $pages = $pagesRepo
            ->select($req->params->pageType)
            ->orderBy(($req->queryVar("order-default") === null ? "`createdAt`" : "`id`") . " DESC")
            ->limit($pagesRepo::HARD_LIMIT)
            ->fetchAll();
        $res->json($pages);
    }
    /**
     * PUT /api/pages/[w:pageType]/[w:pageId]/blocks: Overwrites the block tree
     * of $req->params->pageId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepoOld
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     * @param \Sivujetti\Block\BlocksInputValidatorScanner $scanner
     */
    public function updatePageBlocks(Request $req,
                                     Response $res,
                                     PagesRepository $pagesRepoOld,
                                     PagesRepository2 $pagesRepo,
                                     BlocksInputValidatorScanner $scanner): void {
        $pageType = $pagesRepoOld->getPageTypeOrThrow($req->params->pageType);
        [$validStorableBlocksJson, $errors, $errCode] = $scanner->createStorableBlocks(fn() => $pagesRepo->select($pageType->name, ["@blocks"])
            ->where("id = ?", $req->params->pageId)
            ->fetch()?->blocks, $req);
        if ($errCode) {
            $res->status($errCode)->json($errors);
            return;
        }
        //
        $numRows = $pagesRepo->update($pageType->name)
            ->values((object) ["blocks" => $validStorableBlocksJson, "lastUpdatedAt" => time()])
            ->where("id = ?", $req->params->pageId)
            ->execute();
        //
        $res->status(200)->json(["ok" => "ok", "numAffectedRows" => $numRows]);
    }
    /**
     * PUT /api/pages/[w:pageType]/[w:pageId]: updates basic info of $req->params
     * ->pageId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     */
    public function updatePage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        $numRows = $pagesRepo->updateById($pageType, $req->params->pageId, $req->body);
        //
        $res->status(200)->json(["ok" => "ok", "numAffectedRows" => $numRows]);
    }
    /**
     * DELETE /api/pages/[w:pageType]/[w:pageSlug]: deletes page that has slug
     * "/{$req->params->pageSlug}" and type $req->params->pageType from the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     * @param \Sivujetti\Page\PagesRepository $pagesRepoOld
     */
    public function deletePage(Request $req,
                               Response $res,
                               PagesRepository2 $pagesRepo,
                               PagesRepository $pagesRepoOld): void {
        if ($req->params->pageSlug === "/")
            throw new PikeException("Refusing to delete home page", PikeException::BAD_INPUT);
        $pageType = $pagesRepoOld->getPageTypeOrThrow($req->params->pageType);
        $numRows = $pagesRepo
            ->delete($pageType->name)
            ->where("slug = ?", ["/{$req->params->pageSlug}"])
            ->execute();
        $res->status(200)->json(["ok" => "ok", "numAffectedRows" => $numRows]);
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @return \Sivujetti\Page\Entities\Page
     */
    public static function createEmptyPage(PageType $pageType): Page {
        $page = new Page;
        $page->slug = "-";
        $page->path = "-";
        $page->level = 1;
        $page->title = $pageType->defaultFields->title->defaultValue;
        $page->meta = new \stdClass;
        $page->id = "-";
        $page->type = $pageType->name;
        $page->blocks = [];
        $page->status = Page::STATUS_DRAFT;
        $page->createdAt = time();
        $page->lastUpdatedAt = $page->createdAt;
        return $page;
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\Page\Entities\Page $page
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param bool $isPlaceholderPage
     */
    private static function sendPageResponse(Request $req,
                                             Response $res,
                                             PagesRepository $pagesRepo,
                                             SharedAPIContext $apiCtx,
                                             TheWebsite $theWebsite,
                                             Page $page,
                                             PageType $pageType,
                                             bool $isPlaceholderPage) {
        $themeAPI = new UserThemeAPI("theme", $apiCtx, new Translator);
        $_ = new UserTheme($themeAPI); // Note: mutates $apiCtx->userDefinesAssets|etc
        //
        self::runBlockBeforeRenderEvent($page->blocks, $apiCtx->blockTypes, $pagesRepo);
        $apiCtx->triggerEvent($themeAPI::ON_PAGE_BEFORE_RENDER, $page);
        $editModeIsOn = $isPlaceholderPage || ($req->queryVar("in-edit") !== null);
        $theWebsite->activeTheme->loadStyles($editModeIsOn);
        $tmpl = new WebPageAwareTemplate(
            $page->layout->relFilePath,
            ["serverHost" => self::getServerHost($req)],
            apiCtx: $apiCtx,
            theWebsite: $theWebsite,
            pluginNames: array_map(fn($p) => $p->name, $theWebsite->plugins->getArrayCopy()),
            useEditModeMarkup: $editModeIsOn,
            assetUrlCacheBustStr: "v={$theWebsite->versionId}"
        );
        $html = $tmpl->render([
            "currentPage" => $page,
            "currentUrl" => $req->path,
            "site" => $theWebsite,
        ]);
        if ($editModeIsOn && ($bodyEnd = strrpos($html, "</body>")) > 0) {
            $html = substr($html, 0, $bodyEnd) .
                "<script>window.sivujettiCurrentPageData = " . $tmpl->escInlineJs(json_encode([
                    "page" => self::pageToRaw($page, $pageType, $isPlaceholderPage),
                    "layout" => self::layoutToRaw($page->layout),
                    "theme" => self::themeToRaw($theWebsite->activeTheme),
                ], JSON_UNESCAPED_UNICODE)) . "</script>" .
                "<script src=\"{$tmpl->assetUrl("public/sivujetti/sivujetti-webpage.js")}\"></script>" .
            substr($html, $bodyEnd);
        }
        $res->html($html);
    }
    /**
     * @param \Pike\Request $req
     * @return string "http://localhost", "https://server.com"
     */
    public static function getServerHost(Request $req): string {
        // https://stackoverflow.com/a/16076965
        $s = ($req->attr("HTTPS") === "on" ||
            $req->attr("HTTP_X_FORWARDED_PROTO") === "https" ||
            $req->attr("HTTP_X_FORWARDED_SSL") === "on") ? "s" : "";
        return "http{$s}://{$req->attr("HTTP_HOST")}";
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $branch
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     */
    public static function runBlockBeforeRenderEvent(array $branch,
                                                     BlockTypes $blockTypes,
                                                     PagesRepository $pagesRepo): void {
        foreach ($branch as $block) {
            if ($block->type === "__marker")
                continue;
            $blockType = $blockTypes->{$block->type};
            if (array_key_exists(RenderAwareBlockTypeInterface::class, class_implements($blockType)))
                $blockType->onBeforeRender($block, $blockType, App::$adi);
            $children = $block->type !== "GlobalBlockReference" ? $block->children : $block->__globalBlockTree?->blocks ?? [];
            if ($children)
                self::runBlockBeforeRenderEvent($children, $blockTypes, $pagesRepo);
        }
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     * @param ?string $layoutId = null
     * @return \Sivujetti\Page\Entities\Page
     */
    private static function createEmptyPageWithBlocks(PageType $pageType,
                                                      LayoutsRepository $layoutsRepo,
                                                      ?string $layoutId = null): Page {
        $page = self::createEmptyPage($pageType);
        foreach ($pageType->ownFields as $field) {
            $page->{$field->name} = $field->defaultValue;
        }
        if (!$layoutId)
            $layoutId = $pageType->defaultLayoutId;
        $layout = $layoutsRepo->findById($layoutId);
        if (!$layout) throw new PikeException("Layout `{$layoutId}` doesn't exist",
                                              PikeException::BAD_INPUT);
        $page->layoutId = $layout->id;
        $page->layout = $layout;
        self::mergeLayoutBlocksTo($page, $page->layout, $pageType);
        return $page;
    }
    /**
     * @param \Sivujetti\Page\Entities\Page $toPage
     * @param \Sivujetti\Layout\Entities\Layout $fromLayout
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     */
    private static function mergeLayoutBlocksTo(Page $toPage,
                                                Layout $fromLayout,
                                                PageType $pageType): void {
        foreach ($fromLayout->structure as $part) {
            if ($part->type === Layout::PART_TYPE_GLOBAL_BLOCK_TREE)
                $toPage->blocks[] = Block::fromBlueprint((object) [
                    "type" => Block::TYPE_GLOBAL_BLOCK_REF,
                    "title" => "",
                    "defaultRenderer" => "sivujetti:block-auto",
                    "children" => [],
                    "initialData" => (object) [
                        "globalBlockTreeId" => $part->globalBlockTreeId,
                        "overrides" => GlobalBlockReferenceBlockType::EMPTY_OVERRIDES,
                        "useOverrides" => 0,
                    ],
                ]);
            elseif ($part->type === Layout::PART_TYPE_PAGE_CONTENTS)
                array_push($toPage->blocks, ...array_map([Block::class, "fromBlueprint"], array_merge(
                    [(object) [
                        "type" => Block::TYPE_PAGE_INFO,
                        "title" => "",
                        "defaultRenderer" => "sivujetti:block-auto",
                        "children" => [],
                        "initialData" => (object) ["overrides" => "[]"]
                    ]],
                    $pageType->blockFields
                )));
        }
    }
    /**
     * @param \Sivujetti\Page\Entities\Page $page
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param bool $isPlaceholderPage
     * @return object
     */
    private static function pageToRaw(Page $page,
                                      PageType $pageType,
                                      bool $isPlaceholderPage): object {
        $out = (object) [
            "id" => $page->id,
            "slug" => $page->slug,
            "path" => $page->path,
            "level" => $page->level,
            "type" => $page->type,
            "title" => $page->title,
            "meta" => $page->meta,
            "layoutId" => $page->layoutId,
            "status" => $page->status,
            "createdAt" => $page->createdAt,
            "lastUpdatedAt" => $page->lastUpdatedAt,
            "blocks" => $page->blocks,
            "isPlaceholderPage" => $isPlaceholderPage,
        ];
        foreach ($pageType->ownFields as $field)
            $out->{$field->name} = $page->{$field->name};
        return $out;
    }
    /**
     * @param \Sivujetti\Layout\Entities\Layout $layout
     * @return object
     */
    private static function layoutToRaw(Layout $layout): object {
        return (object) [
            "friendlyName" => $layout->friendlyName,
            "structure" => $layout->structure,
        ];
    }
    /**
     * @param \Sivujetti\Theme\Entities\Theme $theme
     * @psalm-return object{id: string}
     */
    private static function themeToRaw(Theme $theme): object {
        return (object) [
            "id" => $theme->id,
        ];
    }
    /**
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @return object
     */
    private static function theWebsiteToRaw(TheWebsite $theWebsite): object {
        return (object) [
            "name" => $theWebsite->name,
            "langTag" => "{$theWebsite->lang}_{$theWebsite->country}",
            "description" => $theWebsite->description,
            "hideFromSearchEngines" => $theWebsite->hideFromSearchEngines,
            "versionId" => $theWebsite->versionId,
        ];
    }
}
