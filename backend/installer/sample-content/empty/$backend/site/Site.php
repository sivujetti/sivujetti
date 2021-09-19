<?php declare(strict_types=1);

namespace MySite;

use Sivujetti\UserSite\{UserSiteAPI, UserSiteInterface};

class Site implements UserSiteInterface {
    /**
     * @param \Sivujetti\UserSite\UserSiteAPI $api
     */
    public function __construct(UserSiteAPI $api) {
        //
    }
}
