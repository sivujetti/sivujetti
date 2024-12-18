<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\PikeException;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\UserPlugin\UserPluginInterface;
use Sivujetti\UserSite\UserSiteInterface;

/**
 * Stuff registered by Site.php, Theme.php, SomePlugin.php. Gets populated on
 * every request.
 */
final class SharedAPIContext {
    public const PHASE_INITIAL = 0;
    public const PHASE_READY_FOR_ROUTING = 1;
    public const PHASE_READY_TO_EXECUTE_ROUTE_CONTROLLER = 2;
    /** @var int */
    private int $appPhase;
    /** @var array<string, callable[]> */
    private array $eventListeners;
    /** @var array<string, callable[]> */
    private array $filters;
    /** @var object @see Sivujetti\Boot\BootModule->loadEssentialsIfNotLoaded()  */
    public BlockTypes $blockTypes;
    /** @var object {"css" => object[], "js" => object[]} @see also \Sivujetti\UserTheme\UserThemeAPI->enqueueCss|JsFile() */
    public object $userDefinedAssets;
    /** @var array<int, array{fileId: string, impl: \Sivujetti\BlockType\JsxLikeRenderingBlockTypeInterface|null, friendlyName: string|null, associatedWith: string|null}> \Sivujetti\UserSite\UserSiteAPI->registerBlockRenderer() */
    public array $blockRenderers;
    /** @var object {"editApp" => object[], "previewApp" => object[]} @see also \Sivujetti\UserSite\UserSiteAPI->enqueueEdit|PreviewAppJsFile() */
    public object $devJsFiles;
    /** @var array<string, \Sivujetti\UserPlugin\UserPluginInterface> */
    public array $userPlugins;
    /** @var \Sivujetti\UserSite\UserSiteInterface i.e. \MySite\Site */
    public UserSiteInterface $userSite;
    /***/
    public function __construct() {
        $this->appPhase = 0;
        $this->eventListeners = [];
        $this->filters = [];
        $this->userDefinedAssets = (object) ["css" => [], "js" => []];
        $this->blockRenderers = [];
        $this->devJsFiles = (object) ["editApp" => [], "previewApp" => []];
        $this->userPlugins = [];
    }
    /**
     * @param string $eventName
     * @param callable $fn
     * @return int listener id
     */
    public function addEventListener(string $eventName, callable $fn): int {
        $this->eventListeners[$eventName][] = $fn;
        return count($this->eventListeners[$eventName]) - 1;
    }
    /**
     * @param string $name
     * @param mixed ...$args
     */
    public function triggerEvent(string $name, mixed ...$args): void {
        foreach (($this->eventListeners[$name] ?? []) as $fn)
            call_user_func_array($fn, $args);
    }
    /**
     * @param string $for
     * @param callable $fn
     * @return int function id
     */
    public function addFilter(string $for, callable $fn): int {
        $this->filters[$for][] = $fn;
        return count($this->filters[$for]) - 1;
    }
    /**
     * @param string $name
     * @param mixed ...$args
     * @return mixed
     */
    public function applyFilters(string $name, mixed ...$args): mixed {
        foreach (($this->filters[$name] ?? []) as $fn)
            $args[0] = call_user_func_array($fn, $args);
        return $args[0];
    }
    /**
     * @return int self::APP_PHASE_*
     */
    public function getAppPhase(): int {
        return $this->appPhase;
    }
    /**
     * @param int $phase self::APP_PHASE_*
     */
    public function setAppPhase(int $phase): void {
        $this->appPhase = $phase;
    }
    /**
     * @param string $name
     * @return \Sivujetti\UserPlugin\UserPluginInterface|null
     * @throws \Pike\PikeException
     */
    public function getPlugin(string $name): ?UserPluginInterface {
        if ($this->getAppPhase() < SharedAPIContext::PHASE_READY_TO_EXECUTE_ROUTE_CONTROLLER)
            throw new PikeException("You should call \$api->getPlugin() inside \$api->on(\$api::ON_ROUTE_" .
                                    "CONTROLLER_BEFORE_EXEC) or \$api->on(\$api::ON_PAGE_BEFORE_RENDER) " .
                                    "to ensure they're all loaded",
                                    PikeException::ERROR_EXCEPTION);
        return $this->userPlugins[$name] ?? null;
    }
}
