<?php declare(strict_types=1);

namespace KuuraCms\UserSite;

interface UserSiteInterface {
    /**
     * @param \KuuraCms\UserSite\UserSiteAPI $api
     */
    public function __construct(UserSiteAPI $api);
}
