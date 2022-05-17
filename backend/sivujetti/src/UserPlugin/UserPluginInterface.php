<?php declare(strict_types=1);

namespace Sivujetti\UserPlugin;

/**
 * @method \Sivujetti\Auto\ACLRulesBuilder defineAclRules(\Sivujetti\Auto\ACLRulesBuilder $builder)
 */
interface UserPluginInterface {
    /**
     * @param \Sivujetti\UserPlugin\UserPluginAPI $api
     */
    public function __construct(UserPluginAPI $api);
}
