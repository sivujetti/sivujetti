<?php declare(strict_types=1);

namespace KuuraSite;

use KuuraCms\Website\{WebsiteAPI, WebsiteInterface};

class Site implements WebsiteInterface {
    /**
     * @param \RadCms\Website\WebsiteAPI $api
     */
    public function __construct(WebsiteAPI $api) {
        //
    }
}
