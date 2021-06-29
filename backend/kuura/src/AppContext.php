<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\TheWebsite\Entities\TheWebsite;
use MySite\Site;
use Pike\AppContext as PikeAppContext;

final class AppContext extends PikeAppContext {
    /** @var \KuuraCms\SharedAPIContext */
    public SharedAPIContext $storage;
    /** @var \KuuraCms\TheWebsite\Entities\TheWebsite */
    public TheWebsite $theWebsite;
    /** @var \MySite\Site */
    public Site $userSite;
}
