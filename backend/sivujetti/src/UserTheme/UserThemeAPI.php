<?php declare(strict_types=1);

namespace Sivujetti\UserTheme;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\Entities\PageLayout;
use Sivujetti\{PushIdGenerator, SharedAPIContext, Translator, ValidationUtils};
use Sivujetti\UserPlugin\UserPluginAPI;

/**
 * An API for BACKEND_PATH . site/Theme.php classes.
 */
final class UserThemeAPI extends UserPluginAPI {
    private Translator $translator;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $storage
     * @param ?\Sivujetti\Translator $translator = null
     */
    public function __construct(string $namespace,
                                SharedAPIContext $storage,
                                ?Translator $translator = null) {
        $this->namespace = $namespace;
        $this->storage = $storage;
        $this->translator = $translator;
    }
    /**
     * @param string $friendlyName
     * @param string $relFilePath
     * @param ?\Closure $getInitialBlocks = null callable(void): \Sivujetti\Block\Entities\Block[]
     * @param ?bool $isDefault = null
     */
    public function registerPageLayout(string $friendlyName,
                                       string $relFilePath,
                                       ?\Closure $getInitialBlocks = null,
                                       ?bool $isDefault = null): void {
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $mut = $this->storage->getDataHandle();
        $layout = new PageLayout;
        $layout->id = strval(count($mut->pageLayouts) + 1);
        $layout->friendlyName = $friendlyName;
        $layout->relFilePath = $relFilePath;
        $layout->getInitialBlocks = $getInitialBlocks ?? fn() => $this->makeDefaultBlocks();
        $layout->isDefault = $isDefault ?? false;
        $mut->pageLayouts[] = $layout;
    }
    /**
     * @param string $url
     * @param array $attrs = []
     */
    public function enqueueCssFile(string $url, array $attrs = []): void {
        $this->storage->getDataHandle()->userDefinedCssFiles->webPage[] = (object) [
            "url" => $url,
            "attrs" => $attrs,
        ];
    }
    /**
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private function makeDefaultBlocks(): array {
        $p = new Block;
        $p->type = Block::TYPE_PARAGRAPH;
        $p->title = "";
        $p->renderer = "sivujetti:block-auto";
        $p->id = PushIdGenerator::generatePushId();
        $p->children = [];
        $p->text = $this->translator->t("Text here");
        $p->cssClass = "";
        return [$p];
    }
}
