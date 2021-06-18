<?php declare(strict_types=1);

namespace KuuraSite;

use KuuraCms\Theme\{ThemeAPI, ThemeInterface};

class Theme implements ThemeInterface {
    /**
     * Ajetaan jokaisen sivupyynnön yhteydessä. Rekisteröi sivutemplaatit
     * ($api->registerLayoutForUrlPattern(<tiedostopolku>, <urlMatcheri>)) ja
     * tyylitiedostot ($api->enqueueCss|JsFile(<urli>)).
     *
     * @param \KuuraCms\Theme\ThemeAPI $api
     */
    public function __construct(ThemeAPI $api) {
        $api->registerPageLayout('Full width',
                                 'layout.full-width.tmpl.php',
                                 null,
                                 true);
        $api->registerPageLayout('With sidebar',
                                 'layout.with-sidebar.tmpl.php',
                                 null); // todo
        $api->enqueueCssFile('main.css');
    }
}
