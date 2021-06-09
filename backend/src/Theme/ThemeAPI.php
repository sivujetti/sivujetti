<?php declare(strict_types=1);

namespace KuuraCms\Theme;

use Pike\{FileSystem, PikeException};
use KuuraCms\Plugin\PluginAPI;
use KuuraCms\{SharedAPIContext, ValidationUtils};
use KuuraCms\Entities\PageLayout;

final class ThemeAPI extends PluginAPI {
    /** @var object Reference to SharedApiContext->data */
    private object $storageData;
    /**
     * @param string $namespace
     * @param \KuuraCms\SharedAPIContext $storage
     * @param \Pike\FileSystem $fs = null
     */
    public function __construct(string $namespace,
                                SharedAPIContext $storage,
                                FileSystem $fs = null) {
        parent::__construct($namespace, $storage);
        if (!$fs) throw new \InvalidArgumentException('Bad input');
        $this->fs = $fs;
        $this->storageData = $storage->getDataHandle($this);
    }
    /**
     * @param string $friendlyName
     * @param string $relFilePath
     * @param ?array<int, string> $sections = null
     * @param ?bool $isDefault = null
     */
    public function registerPageLayout(string $friendlyName,
                                       string $relFilePath,
                                       ?array $sections = null,
                                       ?bool $isDefault = null): void {
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $layout = new PageLayout;
        $layout->friendlyName = $friendlyName;
        $layout->relFilePath = $relFilePath;
        $layout->sections = $sections ?? ['main'];
        $layout->isDefault = $isDefault ?? false;
        $this->storageData->pageLayouts[] = $layout;
    }
    /**
     * Rekisteröi <script src="<?= $url ?>" ...> sisällytettäväksi sivutemplaatin
     * <?= $this->jsFiles() ?> outputtiin. Esimerkki: enqueueJsFile('my-file.js',
     * ['type' => 'module']);
     *
     * @param string $url
     * @param array $attrs = array
     */
    public function enqueueJsFile(string $url, array $attrs = []): void {
        $this->storageData->userDefinedJsFiles->webPage[] = (object) [
            'url' => $url,
            'attrs' => $attrs,
        ];
    }
    /**
     * Rekisteröi <link href="<?= $url ?>" ...> sisällytettäväksi sivutemplaatin
     * <?= $this->cssFiles() ?> outputtiin. Esimerkki: enqueueCssFile('my-file.css',
     * ['media' => 'screen']);
     *
     * @param string $url
     * @param array $attrs = array
     */
    public function enqueueCssFile(string $url, array $attrs = []): void {
        $this->storageData->userDefinedCssFiles->webPage[] = (object) [
            'url' => $url,
            'attrs' => $attrs,
        ];
    }
}
