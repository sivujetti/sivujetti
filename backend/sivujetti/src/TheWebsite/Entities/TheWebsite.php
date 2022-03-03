<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite\Entities;

use Sivujetti\Theme\Entities\Theme;

final class TheWebsite {
    /** @var string e.g. "My site" */
    public string $name;
    /** @var string e.g. "fi", "en" */
    public string $lang;
    /** @var string */
    public string $aclRulesJson;
    /** @var string */
    public string $firstRunsJson;
    /** @var \Sivujetti\Plugin\Entities\Plugin[] */
    public \ArrayObject $plugins;
    /** @var \Sivujetti\PageType\Entities\PageType[] */
    public \ArrayObject $pageTypes;
    /** @var \Sivujetti\Theme\Entities\Theme */
    public Theme $activeTheme;
}
