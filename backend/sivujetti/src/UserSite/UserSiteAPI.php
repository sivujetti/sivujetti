<?php declare(strict_types=1);

namespace Sivujetti\UserSite;

use Sivujetti\{BaseAPI, ValidationUtils};
use Sivujetti\BlockType\{BlockTypeInterface, JsxLikeRenderingBlockTypeInterface};
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
        if (($errors = Validation::makeValueValidator()
            ->rule("identifier")
            ->rule("maxLength", ValidationUtils::INDEX_STR_MAX_LENGTH)
            ->validate($name)))
            throw new PikeException(implode("\n", $errors),
                                    PikeException::BAD_INPUT);
        $this->apiCtx->blockTypes->{$name} = $instance;
    }
    /**
     * Adds $url to a list of urls, that will be included at the end of
     * "backend/assets/edit-app-wrapper.tmpl.php". $url is relative to $appEnv->constants["BASE_URL"] .
     * "public/" ("foo/file.js" will become "http://mysite.com/public/foo/file.js")
     *
     * @param string $url e.g. "my-site.bundle.js"
     */
    public function enqueueEditAppJsFile(string $url): void {
        $this->enqueueDevJsFile($url, "editApp");
    }
    /**
     * Adds $url to a list of urls, that will be included with the $tmpl->jsFiles()
     * when the edit mode is on. $url is relative to $appEnv->constants["BASE_URL"] .
     * "public/" ("foo/file.js" will become "http://mysite.com/public/foo/file.js")
     *
     * @param string $url e.g. "my-site.bundle.js"
     */
    public function enqueuePreviewAppJsFile(string $url): void {
        $this->enqueueDevJsFile($url, "previewApp");
    }
    /**
     * @param string $url
     * @param string $key = "editApp"
     * @psalm-param "editApp"|"previewApp" $key = "editApp"
     */
    protected function enqueueDevJsFile(string $url, string $key = "editApp"): void {
        $this->apiCtx->devJsFiles->{$key}[] = $url;
    }
    /**
     * Adds $fileId to a list of names that can be used as $block->renderer.
     *
     * @param string $fileId "my-file", "site:my-file", "sivujetti:block-auto"
     * @param ?string $friendlyName = null "Default"
     * @param ?string $for = null "Pages", "Articles", "*"
     * @param ?\Sivujetti\BlockType\JsxLikeRenderingBlockTypeInterface $impl = null
     */
    public function registerBlockRenderer(string $fileId,
                                          ?string $friendlyName = null,
                                          ?string $for = null,
                                          ?JsxLikeRenderingBlockTypeInterface $impl = null): void {
        $this->apiCtx->blockRenderers[] = [
            "fileId" => str_contains($fileId, ":") ? $fileId : "site:{$fileId}",
            "impl" => $impl,
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
