<?php declare(strict_types=1);

namespace Sivujetti\UserSite;

use Sivujetti\{BaseAPI, Template};
use Sivujetti\BlockType\BlockTypeInterface;
use Pike\{PikeException, Validation};
use Sivujetti\UserPlugin\UserPluginInterface;

/**
 * An API for BACKEND_PATH . site/Site.php classes.
 */
class UserSiteAPI extends BaseAPI {
    /**
     * @param string $name
     * @param \Sivujetti\BlockType\BlockTypeInterface $instance
     * @throws \Pike\PikeException If $name is not valid identifier
     */
    public function registerBlockType(string $name,
                                      BlockTypeInterface $instance): void {
        if (($errors = Validation::makeValueValidator()->rule("identifier")->validate($name)))
            throw new PikeException(implode("\n", $errors),
                                    PikeException::BAD_INPUT);
        $this->apiCtx->blockTypes->{$name} = $instance;
    }
    /**
     * Adds $url to a list of urls, that will be included at the end of
     * "backend/assets/edit-app-wrapper.tmpl.php". $url is relative to SIVUJETTI_BASE_URL .
     * "public/" ("foo/file.js" will become "http://mysite.com/public/foo/file.js")
     *
     * @param string $url e.g. "my-site.bundle.js"
     */
    public function enqueueEditAppJsFile(string $url): void {
        $this->apiCtx->adminJsFiles[] = $url;
    }
    /**
     * Adds $fileId to a list of names that can be used as $block->renderer.
     *
     * @param string $fileId "my-file", "site:my-file", "sivujetti:block-auto"
     * @param ?string $friendlyName = null "Pages listing"
     * @param ?string $for = null "Pages", "Articles", "*"
     * @see \Sivujetti\Template::completePath()
     */
    public function registerBlockRenderer(string $fileId,
                                          ?string $friendlyName = null,
                                          ?string $for = null): void {
        // @allow \Pike\PikeException
        Template::completePath($fileId, allowSubFolders: true);
        $this->apiCtx->validBlockRenderers[] = [
            "fileId" => str_contains($fileId, ":") ? $fileId : "site:{$fileId}",
            "friendlyName" => $friendlyName,
            "associatedWith" => $for
        ];
    }
    /**
     * @see \Sivujetti\SharedAPIContext->getPlugin()
     */
    public function getPlugin(string $name): ?UserPluginInterface {
        return $this->apiCtx->getPlugin($name);
    }
}
