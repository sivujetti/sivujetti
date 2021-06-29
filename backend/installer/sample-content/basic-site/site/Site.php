<?php declare(strict_types=1);

namespace MySite;

use KuuraCms\UserSite\{UserSiteAPI, UserSiteInterface};

class Site implements UserSiteInterface {
    /**
     * @param \RadCms\UserSite\UserSiteAPI $api
     */
    public function __construct(UserSiteAPI $api) {
        //
    }
}
