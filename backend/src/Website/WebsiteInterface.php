<?php declare(strict_types=1);

namespace KuuraCms\Website;

interface WebsiteInterface {
    /**
     * @param \KuuraCms\Website\WebsiteAPI $api
     */
    public function __construct(WebsiteAPI $api);
}
