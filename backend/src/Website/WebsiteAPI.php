<?php declare(strict_types=1);

namespace KuuraCms\Website;

use KuuraCms\{BaseAPI, SharedAPIContext, ValidationUtils};
use KuuraCms\Block\BlockTypeInterface;

/**
 * An API for WORKSPACE_PATH . site/Site.php classes.
 */
class WebsiteAPI extends BaseAPI {
    /** @var object Reference to SharedApiContext->data */
    private object $storageData;
    /**
     * @inheritdoc
     */
    public function __construct(string $namespace, SharedAPIContext $storage) {
        parent::__construct($namespace, $storage);
        $this->storageData = $storage->getDataHandle($this);
    }
    /**
     * @todo
     */
    public function registerBlockType(string $name, \Closure $blockTypeFactory): void {
        foreach ($blockTypeFactory()->getTemplates() as $path) // todo lazify (see notes.txt)
            ValidationUtils::checkIfValidaPathOrThrow($path);
        $this->storageData->blockTypes[$name] = $blockTypeFactory;
    }
    /**
     * @param string $relUrl Relative to http://<base>/public/
     */
    public function enqueueEditAppJsFile(string $relUrl): void {
        $this->storageData->userDefinedJsFiles->editApp[] = $relUrl;
    }
}
