<?php declare(strict_types=1);

namespace Sivujetti\UserSite;

use Sivujetti\{BaseAPI, SharedAPIContext, Template};
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
     * @see \Sivujetti\Template::completePath()
     */
    public function registerBlockRenderer(string $fileId): void {
        // @allow \Pike\PikeException
        Template::completePath($fileId, allowSubFolders: true);
        $this->apiCtx->validBlockRenderers[] = str_contains($fileId, ":") ? $fileId : "site:{$fileId}";
    }
    /**
     * @param string $name
     * @return \Sivujetti\UserPlugin\UserPluginInterface|null
     * @throws \Pike\PikeException
     */
    public function getPlugin(string $name): ?UserPluginInterface {
        if ($this->apiCtx->getAppPhase() < SharedAPIContext::PHASE_READY_TO_EXECUTE_ROUTE_CONTROLLER)
            throw new PikeException("You should call \$api->getPlugin() inside \$api->on(\$api::ON_ROUTE_" .
                                    "CONTROLLER_BEFORE_EXEC) or \$api->on(\$api::ON_PAGE_BEFORE_RENDER) " .
                                    "to ensure they're all loaded",
                                    PikeException::ERROR_EXCEPTION);
        return $this->apiCtx->userPlugins[$name] ?? null;
    }
}
