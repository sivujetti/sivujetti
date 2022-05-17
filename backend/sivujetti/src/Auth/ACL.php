<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\Auth\ACL as PikeACL;

final class ACL extends PikeACL {
    /** @var int e.g. Developers */
    public const ROLE_SUPER_ADMIN = 1 << 0;
    /** @var int e.g. Designers, power-users */
    public const ROLE_ADMIN       = 1 << 1;
    /** @var int e.g. Site owners */
    public const ROLE_EDITOR      = 1 << 2;
    /** @var int e.g. Writers */
    public const ROLE_AUTHOR      = 1 << 3;
    /** @var int e.g. Moderators */
    public const ROLE_CONTRIBUTOR = 1 << 4;
    /** @var int e.g. Visitors */
    public const ROLE_FOLLOWER    = 1 << 5;
}
