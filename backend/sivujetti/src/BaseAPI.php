<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\ArrayUtils;

/**
 * Shared funtionality for UserThemeAPI, UserSiteAPI and UserPluginAPI.
 */
abstract class BaseAPI {
    public const ON_ROUTE_CONTROLLER_BEFORE_EXEC = "sivujetti:beforeExecRouteController";
    public const ON_PAGE_BEFORE_RENDER = "sivujetti:onPageBeforeRender";
    /** @var string */
    protected string $namespace;
    /** @var \Sivujetti\SharedAPIContext */
    protected SharedAPIContext $apiCtx;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $apiCtx
     */
    public function __construct(string $namespace, SharedAPIContext $apiCtx) {
        $this->namespace = $namespace;
        $this->apiCtx = $apiCtx;
    }
    /**
     * @param string $when e.g. "sivujetti:onPageBeforeRender"
     * @param callable $thenDo
     * @return int listener id
     */
    public function on(string $when, callable $thenDo): int {
        return $this->apiCtx->addEventListener($when, $thenDo);
    }
    /**
     * @param string $url
     * @param array<string, string> $attrs = []
     */
    public function enqueueCssFile(string $url, array $attrs = []): void {
        $this->apiCtx->userDefinedAssets->css[] = (object) [
            "url" => $url,
            "attrs" => $attrs,
        ];
    }
    /**
     * @param string $url
     * @return bool
     */
    public function isCssFileEnqueued(string $url): bool {
        return ArrayUtils::findIndexByKey($this->apiCtx->userDefinedAssets->css, $url, "url") > -1;
    }
    /**
     * @param string $url
     * @param array<string, string> $attrs = []
     */
    public function enqueueJsFile(string $url, array $attrs = []): void {
        $this->apiCtx->userDefinedAssets->js[] = (object) [
            "url" => $url,
            "attrs" => $attrs,
        ];
    }
    /**
     * @param string $url
     * @return bool
     */
    public function isJsFileEnqueued(string $url): bool {
        return ArrayUtils::findIndexByKey($this->apiCtx->userDefinedAssets->js, $url, "url") > -1;
    }
}
