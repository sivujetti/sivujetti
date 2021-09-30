<?php declare(strict_types=1);

namespace Sivujetti;

/**
 * Shared funtionality for WebsiteAPI, PluginAPI etc.
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
}
