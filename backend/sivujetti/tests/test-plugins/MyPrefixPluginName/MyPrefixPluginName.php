<?php declare(strict_types=1);

namespace SitePlugins\MyPrefixPluginName;

use Sivujetti\Auth\{ACL, ACLRulesBuilder};
use Sivujetti\UserPlugin\{UserPluginAPI, UserPluginInterface};

final class MyPrefixPluginName implements UserPluginInterface {
    public static string $testInstructions = "";
    public static string $testRoute1Url = "/plugins/my-prefix-plugin-name/get-something";
    /**
     * @inheritdoc
     */
    public function __construct(UserPluginAPI $api) {
        if (self::$testInstructions === "setTestRoutePermissions") {
            $api->registerHttpRoute("GET", self::$testRoute1Url,
                SomethingController::class, "getSomething",
                ["identifiedBy" => ["read", "something"]]
            );
        }
    }
    /**
     * @inheritdoc
     */
    public function defineAclRules(ACLRulesBuilder $builder): ACLRulesBuilder {
        if (self::$testInstructions === "setTestRoutePermissions") {
            $builder
                ->defineResource("something", ["read"])
                ->setPermissions(ACL::ROLE_ADMIN, "*");
        }
        return $builder;
    }
}
