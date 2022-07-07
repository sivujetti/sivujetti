<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\Auth\ACL as PikeACL;

final class ACL extends PikeACL {
    /** @var int Developers */
    public const ROLE_SUPER_ADMIN  = 1 << 0; // 1
    /** @var int Developers */
    public const ROLE_ADMIN        = 1 << 1; // 2
    /** @var int Designers, power-users */
    public const ROLE_ADMIN_EDITOR = 1 << 2; // 4
    /** @var int Site owners */
    public const ROLE_EDITOR       = 1 << 3; // 8
    /** @var int Writers */
    public const ROLE_AUTHOR       = 1 << 4; // 16
    /** @var int Moderators */
    public const ROLE_CONTRIBUTOR  = 1 << 5; // 32
    /** @var int Visitors */
    public const ROLE_FOLLOWER     = 1 << 6; // 64
}
