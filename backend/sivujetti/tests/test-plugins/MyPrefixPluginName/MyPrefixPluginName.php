<?php declare(strict_types=1);

namespace SitePlugins\MyPrefixPluginName;

use Sivujetti\Auth\{ACL, ACLRulesBuilder};
use Sivujetti\UserPlugin\{UserPluginAPI, UserPluginInterface};

final class MyPrefixPluginName implements UserPluginInterface {
    public static string $testInstructions = "";
    public static string $testRoute1Url = "/plugins/my-prefix-plugin-name/get-something";
    public static string $testRoute2Url = "/plugins/my-prefix-plugin-name/update-something";
    public static string $testRoute3Url = "/plugins/my-prefix-plugin-name/get-something2";
    /**
     * @inheritdoc
     */
    public function __construct(UserPluginAPI $api) {
        if (self::$testInstructions === "setTestRoutePermissions") {
            $api->registerHttpRoute("GET", self::$testRoute1Url,
                SomethingController::class, "getSomething",
                ["identifiedBy" => ["read", "something"]]
            );
            $api->registerHttpRoute("PUT", self::$testRoute2Url,
                SomethingController::class, "updateSomething",
                ["identifiedBy" => ["update", "something"]]
            );
            $api->registerHttpRoute("GET", self::$testRoute3Url,
                SomethingController::class, "getSomething2",
                ["identifiedBy" => ["action", "something2"]]
            );
        }
    }
    /**
     * @inheritdoc
     */
    public function defineAclRules(ACLRulesBuilder $builder): ACLRulesBuilder {
        if (self::$testInstructions === "setTestRoutePermissions") {
            $builder
                ->defineResource("something", ["read", "update"])
                ->setPermissions(ACL::ROLE_ADMIN, "*")
                ->setPermissions(ACL::ROLE_ADMIN_EDITOR, ["read"])
                //
                ->defineResource("something2", ["action"])
                ->setPermissions(ACL::ROLE_ADMIN_EDITOR, ["action"]);
        }
        return $builder;
    }
}
