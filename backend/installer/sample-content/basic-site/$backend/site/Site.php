<?php declare(strict_types=1);

namespace MySite;

use Sivujetti\BlockType\ListingBlockType;
use Sivujetti\UserSite\{UserSiteAPI, UserSiteInterface};

class Site implements UserSiteInterface {
    /**
     * @param \Sivujetti\UserSite\UserSiteAPI $api
     */
    public function __construct(UserSiteAPI $api) {
        $api->enqueueEditAppJsFile("basic-site-bundled.js");
        $api->registerBlockType("ServicesListing", new ListingBlockType);
        $api->registerBlockRenderer("block-services-listing", "Services listing", "Services");
    }
}
