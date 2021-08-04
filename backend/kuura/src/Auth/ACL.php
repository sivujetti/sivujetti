<?php declare(strict_types=1);

namespace KuuraCms\Auth;

use Pike\Auth\ACL as PikeACL;

final class ACL extends PikeACL {
    // Developers
    public const ROLE_SUPER_ADMIN = 1 << 0;
    // Designers, power-users
    public const ROLE_ADMIN       = 1 << 1;
    // Site owners
    public const ROLE_EDITOR      = 1 << 2;
    // Writers
    public const ROLE_AUTHOR      = 1 << 3;
    // Moderators
    public const ROLE_CONTRIBUTOR = 1 << 4;
    // Visitors
    public const ROLE_FOLLOWER    = 1 << 5;
}
