<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\SharedAPIContext;

/**
 * Shared funtionality for WebsiteAPI, PluginAPI etc.
 */
class BaseAPI {
    /** @var string */
    protected string $namespace;
    /** @var \KuuraCms\SharedAPIContext */
    protected SharedAPIContext $storage;
    /**
     * @param string $namespace
     * @param \KuuraCms\SharedAPIContext $storage
     */
    public function __construct(string $namespace, SharedAPIContext $storage) {
        $this->namespace = $namespace;
        $this->storage = $storage;
    }
    /**
     * @see \KuuraCms\SharedAPIContext->addEventListener
     */
    public function on(string $event, callable $callThisFn) {
        return $this->storage->addEventListener("{$this->namespace}:{$event}", $callThisFn);
    }
}
