<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\Db;
use KuuraCms\PageType\PageTypeCollection;
use KuuraCms\Entities\TheWebsite;
use KuuraCms\Entities\PageType;
use KuuraCms\Entities\Plugin;

final class TheWebsiteRepository {
    /**
     * @param \Pike\Db $db
     * @return \KuuraCms\Entities\TheWebsite
     */
    public static function fetchActive(Db $db): TheWebsite {
        $rows = $db->fetchAll(
            'SELECT' .
                ' ws.`name`, ws.`lang`, ws.`aclRules` AS `aclRulesJson`' .
                ', p.`name` AS `pluginName`' .
                ', ct.`name` AS `pageTypeName`, ct.`fields` AS `pageTypeFields`, ct.`isListable` AS `pageTypeIsListable`' .
            ' FROM theWebsite ws' .
            ' LEFT JOIN plugins p ON (1)' .
            ' LEFT JOIN pageTypes ct ON (1)',
            [],
            \PDO::FETCH_CLASS,
            TheWebsite::class
        );
        $out = $rows[0];
        $out->plugins = (new Collector($rows))->collect(Plugin::class, 'pluginName');
        $out->pageTypes = (new Collector($rows, new PageTypeCollection))->collect(PageType::class, 'pageTypeName');
        return $out;
    }
}

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
