<?php declare(strict_types=1);

namespace MySite;

use Sivujetti\UserTheme\{UserThemeAPI, UserThemeInterface};

class Theme implements UserThemeInterface {
    public const TEST_CSS_FILE_NAME = "some-file.css";
    /**
     * @param \Sivujetti\UserTheme\UserThemeAPI $api
     */
    public function __construct(UserThemeAPI $api) {
        $api->enqueueCssFile(self::TEST_CSS_FILE_NAME);
    }
}
