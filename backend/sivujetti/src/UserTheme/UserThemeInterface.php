<?php declare(strict_types=1);

namespace Sivujetti\UserTheme;

interface UserThemeInterface {
    /**
     * @param \Sivujetti\UserTheme\UserThemeAPI $api
     */
    public function __construct(UserThemeAPI $api);
}
