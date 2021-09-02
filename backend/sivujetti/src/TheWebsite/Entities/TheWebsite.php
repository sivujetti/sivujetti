<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite\Entities;

final class TheWebsite {
    /** @var string e.g. "My site" */
    public string $name;
    /** @var string e.g. "fi", "en" */
    public string $lang;
    /** @var string */
    public string $aclRulesJson;
    /** @var \Sivujetti\Plugin\Entities\Plugin[] */
    public \ArrayObject $plugins;
    /** @var \Sivujetti\PageType\Entities\PageType[] */
    public \ArrayObject $pageTypes;
}
