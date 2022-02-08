<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use Pike\Db;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Plugin\Entities\Plugin;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class TheWebsiteRepository {
    /**
     * @param \Pike\Db $db
     * @return ?\Sivujetti\TheWebsite\Entities\TheWebsite
     */
    public static function fetchActive(Db $db): ?TheWebsite {
        if (!($rows = $db->fetchAll(
            "SELECT" .
                " ws.`name`, ws.`lang`, ws.`aclRules` AS `aclRulesJson`" .
                ", ws.`firstRuns` as `firstRunsJson`" .
                ", p.`name` AS `pluginName`, p.`isActive` AS `pluginIsActive`" .
                ", pt.`name` AS `pageTypeName`, pt.`slug` AS `pageTypeSlug`" .
                ", pt.`friendlyName` AS `pageTypeFriendlyName`" .
                ", pt.`friendlyNamePlural` AS `pageTypeFriendlyNamePlural`" .
                ", pt.`description` AS `pageTypeDescription`" .
                ", pt.`fields` AS `pageTypeFieldsJson`" .
                ", pt.`defaultLayoutId` AS `pageTypeDefaultLayoutId`" .
                ", pt.`status` AS `pageTypeStatus`" .
                ", pt.`isListable` AS `pageTypeIsListable`" .
            " FROM \${p}theWebsite ws" .
            " LEFT JOIN \${p}plugins p ON (1)" .
            " LEFT JOIN \${p}pageTypes pt ON (1)",
            [],
            \PDO::FETCH_CLASS,
            TheWebsite::class
        ))) return null;
        $out = $rows[0];
        $out->plugins = (new Collector($rows))->collect(Plugin::class, "pluginName");
        $out->pageTypes = (new Collector($rows))->collect(PageType::class, "pageTypeName");
        return $out;
    }
}

// todo
class Collector {
    /** @var object[] $rows */
    private array $rows;
    /** @var \ArrayAccess|null $out */
    private ?\ArrayAccess $out;
    /**
     * @param object[] $rows
     * @param \ArrayAccess|null $out = null
     */
    public function __construct(array $rows, ?\ArrayAccess $out = null) {
        $this->rows = $rows;
        $this->out = $out;
    }
    /**
     * @param class-string $ClassString
     * @param string $mainProp
     * @return \ArrayAccess
     */
    public function collect(string $ClassString, string $mainProp): \ArrayAccess {
        $out = $this->out ?? new \ArrayObject;
        $map = [];
        foreach ($this->rows as $row) {
            $id = $row->{$mainProp};
            if (!$id || array_key_exists($id, $map))
                continue;
            $map[$id] = 1;
            $out[] = call_user_func("$ClassString::fromParentRs", $row);
        }
        return $out;
    }
}
