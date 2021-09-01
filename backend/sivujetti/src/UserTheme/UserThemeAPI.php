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
     * @param ?bool $isDefault = null
     */
    public function registerPageLayout(string $friendlyName,
                                       string $relFilePath,
                                       ?bool $isDefault = null): void {
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $mut = $this->storage->getDataHandle();
        $layout = new PageLayout;
        $layout->id = strval(count($mut->pageLayouts) + 1);
        $layout->friendlyName = $friendlyName;
        $layout->relFilePath = $relFilePath;
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
}
