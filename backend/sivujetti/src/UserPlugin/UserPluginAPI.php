<?php declare(strict_types=1);

namespace Sivujetti\UserPlugin;

use Pike\{Router};
use Sivujetti\SharedAPIContext;
use Sivujetti\UserSite\UserSiteAPI;

/**
 * An API for BACKEND_PATH . plugins/Name/Name.php classes.
 */
class UserPluginAPI extends UserSiteAPI {
    /** @var \Pike\Router */
    private Router $router;
    /** @var string e.g. "SitePlugins\TomsCoolPlugin\" */
    private string $classNamespace;
    /** @var ?string e.g. "/plugins/toms-cool-plugin" */
    private ?string $routeNamespace;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $storage
     * @param \Pike\Router $router
     */
    public function __construct(string $namespace,
                                SharedAPIContext $storage,
                                Router $router) {
        parent::__construct($namespace, $storage);
        $this->router = $router;
        $this->classNamespace = "SitePlugins\\{$namespace}\\";
        $this->routeNamespace = null;
    }
}
