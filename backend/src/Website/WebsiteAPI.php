<?php declare(strict_types=1);

namespace KuuraCms\Website;

use KuuraCms\{BaseAPI, SharedAPIContext, ValidationUtils};

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
        $this->storageData = $storage->getDataHandle();
        if (!property_exists($this->storageData, 'userDefinedBlockTypes'))
            $this->storageData->userDefinedBlockTypes = [];
        if (!property_exists($this->storageData, 'userDefinedJsFiles'))
            $this->storageData->userDefinedJsFiles = (object) [
                'editApp' => [],
                'webPage' => []
            ];
    }
    /**
     * @todo
     */
    public function registerBlockType(string $name, string $rendererRelFilePath): void {
        ValidationUtils::checkIfValidaPathOrThrow($rendererRelFilePath);
        $this->storageData->userDefinedBlockTypes[] = [$name, $rendererRelFilePath];
    }
    /**
     * @param string $relUrl Relative to http://<base>/public/
     */
    public function enqueueEditAppJsFile(string $relUrl): void {
        $this->storageData->userDefinedJsFiles->editApp[] = $relUrl;
    }
}
