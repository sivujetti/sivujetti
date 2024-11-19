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
                "  .j-Section:not([class*=\"cc-\"]):not([style^=\"background-\"]) > div:empty,",
                "  .j-Columns:not([class*=\"cc-\"]):empty,",
                "  .j-Wrapper:not([class*=\"cc-\"]):empty {",
                "      padding: 1rem;",
                "  }",
                "  .j-Section:not([class*=\"cc-\"]):not([style^=\"background-\"]) > div:empty:before,",
                "  .j-Columns:not([class*=\"cc-\"]):empty:before,",
                "  .j-Wrapper:not([class*=\"cc-\"]):empty:before {",
                "      content: \"Ei vielä sisältöä ...\";",
                "      position: absolute;",
                "      text-shadow: 0px 0px 0px rgba(255,255,255,.83);",
                "      margin: calc(-.5rem - 1px) 0 0 -.5rem;",
                "  }",
                "}",
            ]),
            "blockTypeName" => "@edit-app-all"
        ]]));
    }
}
