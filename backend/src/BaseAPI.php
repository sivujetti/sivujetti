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
     */
    public function registerBlockType(string $name, $blockTypeFactory): void {
        // foreach ($blockTypeFactory()->getTemplates() as $path) // todo lazify (see notes.txt)
        //     ValidationUtils::checkIfValidaPathOrThrow($path);
        // todo {$this->namespace}{$name}
        $this->storage->getDataHandle()->blockTypes[$name] = $blockTypeFactory;
    }
    /**
     * @see \KuuraCms\SharedAPIContext->addEventListener
     */
    public function on(string $event, callable $callThisFn) {
        return $this->storage->addEventListener(
            $event // namespace ??
            , $callThisFn);
    }
}
