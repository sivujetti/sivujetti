<?php declare(strict_types=1);

namespace Sivujetti;

/**
 * Stuff registered by Site.php, Theme.php, SomePlugin.php. Gets populated on
 * every request.
 */
final class SharedAPIContext {
    /** @var array<string, callable[]> */
    private array $eventListeners;
    /** @var object A flexible blob of data (mutated by WebsiteAPI, PluginAPI etc. instances) */
    private object $data;
    /**
     */
    public function __construct() {
        $this->eventListeners = [];
        $this->data = (object) [
            /** @var object @see \Sivujetti\App::create()  */
            "blockTypes" => null,
            /** @var \Sivujetti\Page\Entities\PageLayout[] @see \Sivujetti\UserTheme\UserThemeAPI->registerPageLayout()  */
            "pageLayouts" => [],
            /** @var object {"css" => object[], "js" => object[]} @see \Sivujetti\UserTheme\UserThemeAPI->enqueueCss|JsFile() */
            "userDefinedAssets" => (object) ["css" => [], "js" => []],
            /** @var string[] \Sivujetti\UserSite\UserSiteAPI->registerBlockRenderer() */
            "validBlockRenderers" => [],
            /** @var string[] \Sivujetti\UserSite\UserSiteAPI->enqueueEditAppJsFile() */
            "adminJsFiles" => [],
        ];
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
     * @param string $eventName
     * @param mixed[] ...$args
     */
    public function triggerEvent(string $eventName, mixed ...$args): void {
        foreach ($this->eventListeners[$eventName] ?? [] as $fn)
            call_user_func_array($fn, $args);
    }
    /**
     * @return object
     */
    public function getDataHandle(): object {
        return $this->data;
    }
}
