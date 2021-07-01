<?php declare(strict_types=1);

namespace KuuraCms\TheWebsite;

use Pike\Db;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\TheWebsite\Entities\TheWebsite;

final class TheWebsiteRepository {
    /**
     * @param \Pike\Db $db
     * @return ?\KuuraCms\TheWebsite\Entities\TheWebsite
     */
    public static function fetchActive(Db $db): ?TheWebsite {
        if (!($rows = $db->fetchAll(
            'SELECT' .
                ' ws.`name`, ws.`lang`, ws.`aclRules` AS `aclRulesJson`' .
                ', p.`name` AS `pluginName`' .
                ', ct.`name` AS `pageTypeName`, ct.`blockFields` AS `pageTypeBlockFields`' .
                ', ct.`ownFields` AS `pageTypeOwnFields`, ct.`isListable` AS `pageTypeIsListable`' .
            ' FROM ${p}theWebsite ws' .
            ' LEFT JOIN ${p}plugins p ON (1)' .
            ' LEFT JOIN ${p}pageTypes ct ON (1)',
            [],
            \PDO::FETCH_CLASS,
            TheWebsite::class
        ))) return null;
        $out = $rows[0];
        $out->plugins = (new Collector($rows))->collect(Plugin::class, 'pluginName');
        $out->pageTypes = (new Collector($rows))->collect(PageType::class, 'pageTypeName');
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
        foreach ($this->rows as $row) {
            if (!$row->{$mainProp})
                continue;
            $out[] = call_user_func("$ClassString::fromParentRs", $row);
        }
        return $out;
    }
}
