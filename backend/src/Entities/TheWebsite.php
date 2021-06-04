<?php declare(strict_types=1);

namespace KuuraCms\Entities;

use KuuraCms\PageType\PageTypeCollection;

final class TheWebsite {
    /** @var string e.g. 'My site' */
    public string $name;
    /** @var string e.g. 'fi', 'en' */
    public string $lang;
    /** @var string */
    public string $aclRulesJson;
    /** @var \KuuraCms\Entities\Plugin[] */
    public \ArrayObject $plugins;
    /** @var \KuuraCms\PageType\PageTypeCollection */
    public PageTypeCollection $pageTypes;
}
