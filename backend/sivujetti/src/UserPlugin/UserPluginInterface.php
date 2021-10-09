<?php declare(strict_types=1);

namespace Sivujetti\UserPlugin;

interface UserPluginInterface {
    /**
     * @param \Sivujetti\UserPlugin\UserPluginAPI $api
     */
    public function __construct(UserPluginAPI $api);
}
