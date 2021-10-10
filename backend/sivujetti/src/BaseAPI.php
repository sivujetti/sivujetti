<?php declare(strict_types=1);

namespace Sivujetti;

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
     * @param array<string, string> $attrs = []
     */
    public function enqueueJsFile(string $url, array $attrs = []): void {
        $this->storage->getDataHandle()->userDefinedAssets->js[] = (object) [
            "url" => $url,
            "attrs" => $attrs,
        ];
    }
}
