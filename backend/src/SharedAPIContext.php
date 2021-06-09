<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Theme\ThemeAPI;
use KuuraCms\Website\WebsiteAPI;

final class SharedAPIContext {
    /** @var array<string, callable[]> */
    private array $eventListeners;
    /** @var object A flexible blob of data (mutated by WebsiteAPI, PluginAPI etc. instances) */
    private object $data;
    /**
     */
    public function __construct() {
        $this->eventListeners = [];
        $this->data = new \stdClass;
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
    public function triggerEvent(string $eventName, ...$args): void {
        foreach ($this->eventListeners[$eventName] ?? [] as $fn)
            call_user_func_array($fn, $args);
    }
    /**
     * @todo
     * @return object
     */
    public function getDataHandle(?BaseAPI $for = null): object {
        if ($for) {
            $isThemeApi = $for instanceof ThemeAPI;
            if (($isThemeApi || $for instanceof WebsiteAPI) &&
                !property_exists($this->data, 'userDefinedJsFiles')) {
                $this->data->userDefinedJsFiles = (object) [
                    'editApp' => [],
                    'webPage' => []
                ];
                $this->data->userDefinedCssFiles = (object) [
                    'editApp' => [],
                    'webPage' => []
                ];
            }
            if ($isThemeApi && !property_exists($this->data, 'pageLayouts'))
                $this->data->pageLayouts = [];
        }
        return $this->data;
    }
}
