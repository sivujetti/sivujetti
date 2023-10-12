<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite\Entities;

use Sivujetti\Theme\Entities\Theme;

final class TheWebsite extends \stdClass {
    /** @var string e.g. "My site" */
    public string $name;
    /** @var string e.g. "fi", "en" */
    public string $lang;
    /** @var ?string e.g. "FI", "US" */
    public ?string $country;
    /** @var string e.g. "My website" */
    public string $description;
    /** @var bool */
    public bool $hideFromSearchEngines;
    /** @var string */
    public string $aclRulesJson;
    /** @var string */
    public string $versionId;
    /** @var int Unix timestamp or 0 */
    public int $latestPackagesLastCheckedAt;
    /** @var ?string */
    public ?string $pendingUpdatesJson;
    /** @var string */
    public string $firstRunsJson;
    /** @var \ArrayObject<int, \Sivujetti\Plugin\Entities\Plugin> */
    public \ArrayObject $plugins;
    /** @var \ArrayObject<int, \Sivujetti\PageType\Entities\PageType> */
    public \ArrayObject $pageTypes;
    /** @var \Sivujetti\Theme\Entities\Theme */
    public Theme $activeTheme;
}
