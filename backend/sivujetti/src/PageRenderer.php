<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{AppConfig, Db, Injector, NativeSession, Request, Router};
use Pike\Db\FluentDb2;
use Pike\Interfaces\{FileSystemInterface, SessionInterface};
use Pike\TestUtils\{MutedSpyingResponse, ResponseSpyingAppBuilder};
use Sivujetti\{App, FileSystem, SharedAPIContext};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\TextBlockType;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Boot\BootModule;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\Update\{CurlHttpClient, HttpClientInterface};

use function Sivujetti\createElement as el;

/**
 * @phpstan-import-type UserDefinedAssets from \Sivujetti\SharedAPIContext
 */
class PageRenderer {
    private array $configBundle;
    private ?AppEnv $parentAppEnv = null;
    /**
     * @param Request|string |string $reqOrPath
     * @param (\Closure(UserDefinedAssets $enqueuedFiles): void)|null $onAfterExec = null
     * @return string
     */
    public function renderToString(Request|string $reqOrPath, ?\Closure $onAfterExec = null): string {
        $response = $this->execute($reqOrPath, $onAfterExec);
        return $response->getActualBody();
    }
    /**
     * @param array $configBundle todo
     * @return static
     */
    public function setConfig(array $configBundle): PageRenderer {
        $this->configBundle = $configBundle;
        return $this;
    }
    /**
     * @param \Sivujetti\AppEnv $parentAppEnv
     * @return static
     */
    public function setParentAppEnv(AppEnv $parentAppEnv): PageRenderer {
        $this->parentAppEnv = $parentAppEnv;
        return $this;
    }
    /**
     * @param \Pike\Request|string $reqOrPath
     * @param (\Closure(UserDefinedAssets $enqueuedFiles): void)|null $onAfterExec = null
     * @return \Pike\TestUtils\MutedSpyingResponse
     */
    public function execute(Request|string $reqOrPath, ?\Closure $onAfterExec = null): MutedSpyingResponse {
        static $appBuilder = null;
        if (!$appBuilder) {
            $useParentAppForConfig = $this->parentAppEnv !== null;
            $pageRendererApp = new App($useParentAppForConfig
                ? (new ParentAppAwarePageRendererBootModule($this->configBundle))->use($this->parentAppEnv)
                : (new CustomDbUsingPageRendererBootModule($this->configBundle))
            );
            $mods = $pageRendererApp->getModules();
            $modCount = count($mods);
            $pageRendererApp->setModules([
                // [0] our BootModule
                $mods[0],
                // [*] omit all modules between our BootModule and PagesModule
                // [-2] PagesModule
                $mods[$modCount - 2],
                // [-1] PostBootModule
                $mods[$modCount - 1],
            ]);
            $appBuilder = new ResponseSpyingAppBuilder($pageRendererApp);
        }
        $resp = $appBuilder->sendRequest($reqOrPath);
        if ($onAfterExec) {
            $onAfterExec(clone $appBuilder->getApp()->getDi()->make(SharedAPIContext::class)->userDefinedAssets);
        }
        return $resp;
    }
}

class PageRendererBootModule extends BootModule {
    /**
     * @inheritdoc
     */
    public function init(Router $router, Injector $di): void {
        $router->on("*", function ($req, $res, $next) {
            $req->myData = (object) ["user" => null];
            $next();
        });
    }
}

class ParentAppAwarePageRendererBootModule extends PageRendererBootModule {
    /** @var \Sivujetti\AppEnv */
    private AppEnv $parentAppEnv;
    /** @var bool */
    private bool $isLoaded = false;
    /** @var (\Closure(): void)|null */
    private ?\Closure $resetApiCtx = null;
    /**
     * @inheritdoc
     */
    public function __construct(array $configBundle) {
        if (array_key_exists("db.driver", $configBundle))
            echo "\$config[\"db.*\"] will be ignored";
        parent::__construct($configBundle);
    }
    /**
     * @param \Sivujetti\AppEnv $parentAppEnv
     * @return static
     */
    public function use(AppEnv $parentAppEnv): ParentAppAwarePageRendererBootModule {
        $this->parentAppEnv = $parentAppEnv;
        return $this;
    }
    /**
     * @param \Pike\Injector $di
     */
    public function beforeExecCtrl(Injector $di): void {
        if ($this->isLoaded) {
            $fromPrevCall = $this->resetApiCtx;
            $fromPrevCall();
            $this->resetApiCtx = $di->make(SharedAPIContext::class)->createRestorePoint();
            return;
        }
        $this->configureDi($di);
        $this->resetApiCtx = $di->make(SharedAPIContext::class)->createRestorePoint();
        $this->isLoaded = true;
    }
    /**
     * @return \Closure|null
     * @psalm-return (\Closure(string):string)|null
     */
    public function createLinkPatcher(): ?\Closure {
        if (!$this->parentAppEnv) return null;

        $parentAppEnvConstants = $this->parentAppEnv->constants;
        $q = $parentAppEnvConstants["QUERY_VAR"];
        $origBaseUrl = $parentAppEnvConstants["BASE_URL"];
        $targetBaseUrl = $this->configBundle["env"]["BASE_URL"];
        $baseUrlChanges = $origBaseUrl !== $targetBaseUrl;

        $doPatch = $q || // patch `href="index.php?<q>=/foo` -> `href="/foo` (or `href="/new-dir/foo`)
                   $baseUrlChanges; // patch `href="/foo"` -> `href="/new-dir/foo"`
        if (!$doPatch) return null;

        $tb2 = substr($targetBaseUrl, 0, strlen($targetBaseUrl) - 1);
        $ob2 = substr($origBaseUrl, 0, strlen($origBaseUrl) - 1);
        $untilQuote = "([^\"]+)";
        return fn(string $html): string => preg_replace(
            $q
                // `href="/index.php?q=([^"]+)` or `href="/orig-dir/index.php?q=([^"]+)`
                ? ("/href=\"" . preg_quote("{$origBaseUrl}index.php?{$q}=", "/") . "{$untilQuote}/")
                // `href="([^"]+)` or `href="/orig-dir([^"]+)`
                : ("/href=\"" . preg_quote($ob2, "/") . "{$untilQuote}/"),
            "href=\"{$tb2}$1",
            $html
        );
    }
    /**
     * @param \Pike\Injector $di
     */
    protected function configureDi(Injector $di): void {
        $pdi = $this->parentAppEnv->di;
        $di->share($pdi->make(AppConfig::class));
        $fluentDb = $pdi->make(FluentDb2::class);
        $db = $fluentDb->getDb();
        $dbCls = get_class($db);
        if ($dbCls !== Db::class) // if "SingleConnectionDb", for example
            $di->alias(Db::class, $dbCls);
        $di->share($db);
        $di->share($fluentDb);
        $this->di = $di;
        //
        $di->alias(FileSystemInterface::class, FileSystem::class);
        $di->alias(SessionInterface::class, NativeSession::class);
        $di->alias(HttpClientInterface::class, CurlHttpClient::class);
        //
        $apiCtx = new SharedAPIContext;
        $di->share($apiCtx);
        $papiCtx = $pdi->make(SharedAPIContext::class);
        //
        $blockTypes = clone $pdi->make(BlockTypes::class);
        $this->patchBlockTypesIfNeeded($blockTypes);
        $apiCtx->blockTypes = $blockTypes;
        $di->share($blockTypes);
        //
        $apiCtx->blockRenderers = $papiCtx->blockRenderers; // copy-on-write
        //
        $router = $di->make(Router::class);
        $this->instantiateSite($apiCtx, $router);
        $theWebsite = $pdi->make(TheWebsite::class);
        $this->instantiatePlugins($apiCtx, $router, $theWebsite);
        $di->share($theWebsite);
    }
    /**
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     */
    private function patchBlockTypesIfNeeded(BlockTypes $blockTypes): void {
        $patchBakedLinks = $this->createLinkPatcher();
        if (!$patchBakedLinks) return;
        $blockTypes->{Block::TYPE_TEXT} = new class($patchBakedLinks) extends TextBlockType {
            private \Closure $patchLinksFn;
            public function __construct(\Closure $patchLinksFn) {
                $this->patchLinksFn = $patchLinksFn;
            }
            public function render(object $block,
                                   \Closure $createDefaultProps, 
                                   \Closure $renderChildren,
                                   WebPageAwareTemplate $tmpl): array {
                return el("div", $createDefaultProps(),
                    el("j-raw", [], $this->patchLinksFn->__invoke($block->html)),
                    ...$renderChildren()
                );
            }
        };
    }
}

class CustomDbUsingPageRendererBootModule extends PageRendererBootModule {
    /**
     * @inheritdoc
     */
    protected function doLoadEssentials(Injector $di): void {
        $db = new Db($this->configBundle["app"]);
        $di->share(new AppConfig($this->configBundle["app"]));
        $di->share($db);
        $di->share(new FluentDb2($db));
    }
}
