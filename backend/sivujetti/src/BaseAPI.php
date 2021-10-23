<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\ArrayUtils;

/**
 * Shared funtionality for UserThemeAPI, UserSiteAPI and UserPluginAPI.
 */
abstract class BaseAPI {
    /** @var string */
    protected string $namespace;
    /** @var \Sivujetti\SharedAPIContext */
    protected SharedAPIContext $storage;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $storage
     */
    public function __construct(string $namespace, SharedAPIContext $storage) {
        $this->namespace = $namespace;
        $this->storage = $storage;
    }
    /**
     * @param string $when e.g. "sivujetti:onPageBeforeRender"
     * @param callable $thenDo
     * @return int listener id
     */
    public function on(string $when, callable $thenDo): int {
        return $this->storage->addEventListener($when, $thenDo);
    }
    /**
     * @param string $url
     * @param array<string, string> $attrs = []
     */
    public function enqueueCssFile(string $url, array $attrs = []): void {
        $this->storage->getDataHandle()->userDefinedAssets->css[] = (object) [
            "url" => $url,
            "attrs" => $attrs,
        ];
    }
    /**
     * @param string $url
     * @return bool
     */
    public function isCssFileEnqueued(string $url): bool {
        return ArrayUtils::findIndexByKey($this->storage->getDataHandle()->userDefinedAssets->css, $url, "url") > -1;
    }
    /**
     * @param string $url
     * @param array<string, string> $attrs = []
     */
    public function enqueueJsFile(string $url, array $attrs = []): void {
        $this->storage->getDataHandle()->userDefinedAssets->js[] = (object) [
            "url" => $url,
            "attrs" => $attrs,
        ];
    }
    /**
     * @param string $url
     * @return bool
     */
    public function isJsFileEnqueued(string $url): bool {
        return ArrayUtils::findIndexByKey($this->storage->getDataHandle()->userDefinedAssets->js, $url, "url") > -1;
    }
}
