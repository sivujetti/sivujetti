<?php declare(strict_types=1);

namespace KuuraCms\Theme;

use Pike\{FileSystem, PikeException};
use KuuraCms\Plugin\PluginAPI;
use KuuraCms\{PushId, SharedAPIContext, ValidationUtils};
use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\Entities\PageLayout;

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
     * @param ?array<int, \KuuraCms\Block\Entities\Block> $initialBlocks
     * @param ?bool $isDefault = null
     */
    public function registerPageLayout(string $friendlyName,
                                       string $relFilePath,
                                       ?array $initialBlocks = null,
                                       ?bool $isDefault = null): void {
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $layout = new PageLayout;
        $layout->id = strval(count($this->storageData->pageLayouts) + 1);
        $layout->friendlyName = $friendlyName;
        $layout->relFilePath = $relFilePath;
        $layout->initialBlocks = $initialBlocks ?? self::makeDefaultInitialBlocks();
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
    /**
     * @access private
     */
    private static function makeDefaultInitialBlocks(): array {
        $b1 = new Block;
        $b1->type = Block::TYPE_HEADING;
        $b1->section = 'main';
        $b1->renderer = 'kuura:auto';
        $b1->id = PushId::generate();
        $b1->path = '';
        $b1->title = '';
        $b1->children = [];
        $b1->level = '2';
        $b1->text = '-';
        $b2 = new Block;
        $b2->type = Block::TYPE_PARAGRAPH;
        $b2->section = 'main';
        $b2->renderer = 'kuura:auto';
        $b2->id = PushId::generate();
        $b2->path = '';
        $b2->title = '';
        $b2->children = [];
        $b2->text = '-';
        return [$b1, $b2];
    }
}
