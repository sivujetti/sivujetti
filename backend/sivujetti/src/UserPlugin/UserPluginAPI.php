<?php declare(strict_types=1);

namespace Sivujetti\UserPlugin;

use Pike\{PikeException, Router};
use Sivujetti\BlockType\BlockTypeInterface;
use Sivujetti\SharedAPIContext;
use Sivujetti\UserSite\UserSiteAPI;

/**
 * An API for BACKEND_PATH . plugins/Name/Name.php classes.
 */
final class UserPluginAPI extends UserSiteAPI {
    /** @var \Pike\Router */
    private Router $router;
    /** @var string e.g. "SitePlugins\TomsCoolPlugin\" */
    private string $classNamespace;
    /** @var ?string e.g. "toms-cool-plugin" */
    private ?string $dashifiedNamespace;
    /**
     * @param string $namespace
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Pike\Router $router
     */
    public function __construct(string $namespace,
                                SharedAPIContext $apiCtx,
                                Router $router) {
        parent::__construct($namespace, $apiCtx);
        $this->router = $router;
        $this->classNamespace = "SitePlugins\\{$namespace}\\";
        $this->dashifiedNamespace = null;
    }
    /**
     * @inheritdoc
     */
    public function enqueueCssFile(string $url, array $attrs = []): void {
        $expected = "plugin-{$this->getDashifiedNs()}";
        if (!str_starts_with($url, $expected))
            throw new PikeException("Expected css file url (`{$url}`) to start with `{$expected}`",
                                    PikeException::BAD_INPUT);
        parent::enqueueCssFile($url, $attrs);
    }
    /**
     * @inheritdoc
     */
    public function enqueueJsFile(string $url, array $attrs = []): void {
        if (!str_starts_with($url, "sivujetti/")) {
            $expected = "plugin-{$this->getDashifiedNs()}";
            if (!str_starts_with($url, $expected))
                throw new PikeException("Expected js file url (`{$url}`) to start with `{$expected}`",
                                        PikeException::BAD_INPUT);
        }
        parent::enqueueJsFile($url, $attrs);
    }
    /**
     * @inheritdoc
     */
    public function registerBlockType(string $name,
                                      BlockTypeInterface $instance): void {
        if (!str_starts_with($name, $this->namespace))
            throw new PikeException("Expected block name (`{$name}`) to start with `{$this->namespace}`",
                                    PikeException::BAD_INPUT);
        parent::registerBlockType($name, $instance);
    }
    /**
     * @inheritdoc
     */
    public function enqueueEditAppJsFile(string $url): void {
        $expected = "plugin-{$this->getDashifiedNs()}";
        if (!str_starts_with($url, $expected))
            throw new PikeException("Expected url (`{$url}`) to start with `{$expected}`",
                                    PikeException::BAD_INPUT);
        parent::enqueueEditAppJsFile($url);
    }
    /**
     * @inheritdoc
     */
    public function registerBlockRenderer(string $fileId,
                                          ?string $friendlyName = null,
                                          ?string $for = null): void {
        $expected = "plugins/{$this->namespace}:";
        if (!str_starts_with($fileId, $expected))
            throw new PikeException("Expected file path part of fileId (`{$fileId}`)" .
                                    " to start with `{$expected}`",
                                    PikeException::BAD_INPUT);
        parent::registerBlockRenderer($fileId, $friendlyName, $for);
    }
    /**
     * Registers a http route and its controller. Example:
     * ```
     * registerHttpRoute(
     *     "GET",
     *     // See http://altorouter.com/usage/mapping-routes.html
     *     "/plugins/my-plugin/foo/[i:id]/[w:name]",
     *     MyController::class,
     *     "doSomething",
     *     ["do", "something"]
     * )
     * ```
     *
     * @param string $method
     * @param string $url
     * @param string $ctrlClassPath
     * @param string $ctrlMethodName
     * @param array{consumes?: string, identifiedBy?: array{0: string, 1: string}} $annotations = null e.g. {consumes: "application/json", identifiedBy: ["read", "something"]}
     */
    public function registerHttpRoute(string $method,
                                      string $url,
                                      string $ctrlClassPath,
                                      string $ctrlMethodName,
                                      ?array $annotations = null): void {
        $expected = "/plugins/{$this->getDashifiedNs()}";
        if (!str_starts_with($url, $expected))
            throw new PikeException("Expected route (`{$url}`) to start with `{$expected}`",
                                    PikeException::BAD_INPUT);
        if (!str_starts_with($ctrlClassPath, $this->classNamespace))
            throw new PikeException("Expected ctrlClassPath (`{$ctrlClassPath}`) to start with `{$this->classNamespace}`",
                                    PikeException::BAD_INPUT);
        $this->router->map($method, $url,
            [$ctrlClassPath, $ctrlMethodName, $annotations
                ? $this->completeAndValidateRouteAnnotations($annotations)
                : ["identifiedBy" => [$ctrlMethodName, $ctrlClassPath]]]
        );
    }
    /**
     * Returns currently selected edit app interface language "en", "fi" etc.
     *
     * @return string
     */
    public function getCurrentLang(): string {
        return SIVUJETTI_UI_LANG;
    }
    /**
     * @return string
     */
    private function getDashifiedNs(): string {
        if (!$this->dashifiedNamespace) {
            $dashified = substr(preg_replace("/[A-Z]/", "-\\0", $this->namespace), 1);
            $this->dashifiedNamespace = strtolower($dashified);
        }
        return $this->dashifiedNamespace;
    }
    /**
     * @param array{consumes?: string, identifiedBy?: array{0: string, 1: string}} $annotations
     * @return array{consumes?: string, identifiedBy?: array{0: string, 1: string}}
     * @throws \Pike\PikeException
     */
    private function completeAndValidateRouteAnnotations(array $annotations): array {
        if (($pair = ($annotations["identifiedBy"] ?? null))) { // [aclActionName, aclResourceName]
            if (!is_string($pair[0] ?? null))
                throw new PikeException("\$annotations[\"identifiedBy\"][0] must be a string",
                                        PikeException::BAD_INPUT);
            if (!is_string($pair[1] ?? null))
                throw new PikeException("\$annotations[\"identifiedBy\"][1] must be a string",
                                        PikeException::BAD_INPUT);
            $resourceName = $pair[1];
            if (!str_starts_with($resourceName, "plugins/{$this->namespace}:"))
                $annotations["identifiedBy"][1] = "plugins/{$this->namespace}:{$resourceName}";
        }
        return $annotations;
    }
}
