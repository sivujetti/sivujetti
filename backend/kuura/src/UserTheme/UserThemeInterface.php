<?php declare(strict_types=1);

namespace KuuraCms\UserTheme;

interface UserThemeInterface {
    /**
     * @param \KuuraCms\UserTheme\UserThemeAPI $api
     */
    public function __construct(UserThemeAPI $api);
}
