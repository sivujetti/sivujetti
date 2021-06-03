<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\Db;
use KuuraCms\ContentType\ContentTypeCollection;
use KuuraCms\Entities\TheWebsite;
use KuuraCms\Entities\ContentType;
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
                ', ct.`name` AS `contentTypeName`, ct.`fields` AS `contentTypeFields`, ct.`isListable` AS `contentTypeIsListable`' .
            ' FROM theWebsite ws' .
            ' LEFT JOIN plugins p ON (1)' .
            ' LEFT JOIN contentTypes ct ON (1)',
            [],
            \PDO::FETCH_CLASS,
            TheWebsite::class
        );
        $out = $rows[0];
        $out->plugins = (new Collector($rows))->collect(Plugin::class, 'pluginName');
        $out->contentTypes = (new Collector($rows, new ContentTypeCollection))->collect(ContentType::class, 'contentTypeName');
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
