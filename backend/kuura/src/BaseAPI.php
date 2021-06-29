<?php declare(strict_types=1);

namespace KuuraCms;

/**
 * Shared funtionality for WebsiteAPI, PluginAPI etc.
 */
abstract class BaseAPI {
    /** @var string */
    protected string $namespace;
    /** @var \KuuraCms\SharedAPIContext */
    protected SharedAPIContext $strorage;
    /**
     * @param string $namespace
     * @param \KuuraCms\SharedAPIContext $storage
     */
    public function __construct(string $namespace, SharedAPIContext $storage) {
        $this->namespace = $namespace;
        $this->storage = $storage;
    }
}
