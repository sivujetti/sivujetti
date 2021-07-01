<?php declare(strict_types=1);

namespace MySite;

use KuuraCms\UserTheme\{UserThemeAPI, UserThemeInterface};

class Theme implements UserThemeInterface {
    /**
     * @param \KuuraCms\UserTheme\UserThemeAPI $api
     */
    public function __construct(UserThemeAPI $api) {
        $api->registerPageLayout('Full width',
                                 'layout.default.tmpl.php',
                                 isDefault: true);
        $api->registerPageLayout('With sidebar',
                                 'layout.with-sidebar.tmpl.php');
        $api->enqueueCssFile('basic-site.css');
    }
}
