<?php declare(strict_types=1);

namespace KuuraCms\UserSite;

use KuuraCms\{BaseAPI, Template};

/**
 * An API for BACKEND_PATH . site/Site.php classes.
 */
final class UserSiteAPI extends BaseAPI {
    /**
     * Adds $fileId to a list of names that can be used as $block->renderer.
     *
     * @param string $fileId "my-file", "site:my-file", "kuura:block-auto"
     * @see \KuuraCms\Template::completePath()
     */
    public function registerBlockRenderer(string $fileId): void {
        // @allow \PikeException
        Template::completePath($fileId, allowSubFolders: true);
        $mut = $this->storage->getDataHandle();
        $mut->validBlockRenderers[] = str_contains($fileId, ":") ? $fileId : "site:{$fileId}";
    }
}
