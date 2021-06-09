<?php declare(strict_types=1);

namespace KuuraCms\Theme;

interface ThemeInterface {
    /**
     * @param \KuuraCms\Theme\ThemeAPI $api
     */
    public function __construct(ThemeAPI $api);
}
