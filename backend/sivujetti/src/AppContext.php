<?php declare(strict_types=1);

namespace Sivujetti;

use Sivujetti\TheWebsite\Entities\TheWebsite;
use MySite\Site;
use Pike\AppContext as PikeAppContext;

final class AppContext extends PikeAppContext {
    /** @var \Sivujetti\SharedAPIContext */
    public SharedAPIContext $storage;
    /** @var \Sivujetti\TheWebsite\Entities\TheWebsite */
    public TheWebsite $theWebsite;
    /** @var \MySite\Site */
    public Site $userSite;
}
