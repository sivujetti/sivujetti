<?php declare(strict_types=1);

namespace MySite;

use Sivujetti\UserTheme\{UserThemeAPI, UserThemeInterface};

class Theme implements UserThemeInterface {
    /**
     * @param \Sivujetti\UserTheme\UserThemeAPI $api
     */
    public function __construct(UserThemeAPI $api) {
        $api->enqueueCssFile("empty.css");
    }
}
