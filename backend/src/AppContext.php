<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Entities\TheWebsite;
use KuuraSite\Site;
use Pike\AppContext as PikeAppContext;

final class AppContext extends PikeAppContext {
    /** @var \KuuraSite\Site */
    public Site $site;
    /** @var \KuuraCms\Entities\TheWebsite */
    public TheWebsite $theWebsite;
    /** @var \KuuraCms\SharedAPIContext */
    public SharedAPIContext $storage;
}
