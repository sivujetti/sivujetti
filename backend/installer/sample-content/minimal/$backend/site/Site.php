<?php declare(strict_types=1);

namespace MySite;

use Sivujetti\UserSite\{UserSiteAPI, UserSiteInterface};

class Site implements UserSiteInterface {
    /**
     * @param \Sivujetti\UserSite\UserSiteAPI $api
     */
    public function __construct(UserSiteAPI $api) {
        $api->filter("sivujetti:editAppAdditionalStyleUnits", fn($defs) => array_merge($defs, [(object) [
            "css" => implode("\n", [
                "@layer theme {",
                "  .j-Section:not([style^=\"background-\"]) > div:empty,",
                "  .j-Columns:empty {",
                "      padding: 1rem;",
                "  }",
                "  .j-Section:not([style^=\"background-\"]) > div:empty:before,",
                "  .j-Columns:empty:before {",
                "      content: \"No content yet ...\";",
                "      position: absolute;",
                "      text-shadow: 0px 0px 0px rgba(255, 255, 255, .83);",
                "      margin: calc(-.5rem - 5px) 0 0 -.5rem;",
                "  }",
                "}",
            ]),
            "blockTypeName" => "@edit-app-all"
        ]]));
    }
}
