<?php declare(strict_types=1);

namespace KuuraCms\UserSite;

use KuuraCms\{BaseAPI, Template};

/**
 * An API for BACKEND_PATH . site/Site.php classes.
 */
final class UserSiteAPI extends BaseAPI {
    /**
     * Adds $url to a list of urls, that will be included at the end of
     * "backend/assets/edit-app-wrapper.tmpl.php". $url is relative to KUURA_BASE_URL .
     * "public/" ("foo/file.js" will become "http://mysite.com/public/foo/file.js")
     *
     * @param string $url e.g. "my-site.bundle.js"
     */
    public function enqueueEditAppJsFile(string $url): void {
        $mut = $this->storage->getDataHandle();
        $mut->adminJsFiles[] = $url;
    }
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
