<?php declare(strict_types=1);

namespace KuuraSite;

use KuuraCms\Theme\{ThemeAPI, ThemeInterface};

class Theme implements ThemeInterface {
    /**
     * @param \KuuraCms\Theme\ThemeAPI $api
     */
    public function __construct(ThemeAPI $api) {
        //
    }
}
