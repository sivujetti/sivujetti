<?php declare(strict_types=1);

namespace KuuraCms\UserTheme;

use KuuraCms\Page\Entities\PageLayout;
use KuuraCms\UserPlugin\UserPluginAPI;
use KuuraCms\ValidationUtils;

/**
 * An API for BACKEND_PATH . site/Theme.php classes.
 */
final class UserThemeAPI extends UserPluginAPI {
    /**
     * @param string $friendlyName
     * @param string $relFilePath
     * @param ?array<int, \KuuraCms\Block\Entities\Block> $initialBlocks = null
     * @param ?bool $isDefault = null
     */
    public function registerPageLayout(string $friendlyName,
                                       string $relFilePath,
                                       ?array $initialBlocks = null,
                                       ?bool $isDefault = null): void {
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $mut = $this->storage->getDataHandle();
        $layout = new PageLayout;
        $layout->id = strval(count($mut->pageLayouts) + 1);
        $layout->friendlyName = $friendlyName;
        $layout->relFilePath = $relFilePath;
        $layout->initialBlocks = $initialBlocks ?? [];
        $layout->isDefault = $isDefault ?? false;
        $mut->pageLayouts[] = $layout;
    }
    /**
     * @param string $url
     * @param array $attrs = []
     */
    public function enqueueCssFile(string $url, array $attrs = []): void {
        $this->storage->getDataHandle()->userDefinedCssFiles->webPage[] = (object) [
            'url' => $url,
            'attrs' => $attrs,
        ];
    }
}
