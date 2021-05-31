<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\{AppContext as PikeAppContext};
use KuuraSite\Site;

final class AppContext extends PikeAppContext {
    /** @var \KuuraSite\Site */
    public Site $site;
    /** @var \KuuraCms\SharedAPIContext */
    public SharedAPIContext $storage;
}
