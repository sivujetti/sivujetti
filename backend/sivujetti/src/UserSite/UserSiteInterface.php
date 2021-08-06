<?php declare(strict_types=1);

namespace Sivujetti\UserSite;

interface UserSiteInterface {
    /**
     * @param \Sivujetti\UserSite\UserSiteAPI $api
     */
    public function __construct(UserSiteAPI $api);
}
