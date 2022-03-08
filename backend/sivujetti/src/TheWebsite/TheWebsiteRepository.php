<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use Pike\Db\{FluentDb, NoDupeRowMapper};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Plugin\Entities\Plugin;
use Sivujetti\Theme\Entities\Theme;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class TheWebsiteRepository {
    /**
     * @param \Pike\Db\FluentDb $db
     * @return ?\Sivujetti\TheWebsite\Entities\TheWebsite
     */
    public static function fetchActive(FluentDb $db): ?TheWebsite {
        return $db->select("\${p}theWebsite ws", TheWebsite::class)
            ->fields([
                "ws.`name`", "ws.`lang`", "ws.`aclRules` AS `aclRulesJson`",
                "ws.`firstRuns` as `firstRunsJson`",
                "p.`name` AS `pluginName`", "p.`isActive` AS `pluginIsActive`",
                "pt.`name` AS `pageTypeName`", "pt.`slug` AS `pageTypeSlug`",
                "pt.`friendlyName` AS `pageTypeFriendlyName`",
                "pt.`friendlyNamePlural` AS `pageTypeFriendlyNamePlural`",
                "pt.`description` AS `pageTypeDescription`",
                "pt.`fields` AS `pageTypeFieldsJson`",
                "pt.`defaultLayoutId` AS `pageTypeDefaultLayoutId`",
                "pt.`status` AS `pageTypeStatus`",
                "pt.`isListable` AS `pageTypeIsListable`",
                "t.`name` AS `themeName`", "t.`globalStyles` AS `themeGlobalStylesJson`"
            ])
            ->leftJoin("\${p}plugins p ON (1)")
            ->leftJoin("\${p}pageTypes pt ON (1)")
            ->leftJoin("\${p}themes t ON (t.`isActive` = 1)")
            ->mapWith(new class("name") extends NoDupeRowMapper {
                public function doMapRow(object $row, int $i, array $allRows): object {
                    $keys = [];
                    $row->plugins = new \ArrayObject;
                    foreach ($allRows as $row2) {
                        if (!$row2->pluginName || array_key_exists($row2->pluginName, $keys)) continue;
                        $row->plugins[] = Plugin::fromParentRs($row2);
                        $keys[$row2->pluginName] = 1;
                    }
                    //
                    $keys = [];
                    $row->pageTypes = new \ArrayObject;
                    foreach ($allRows as $row2) {
                        if (!$row2->pageTypeName || array_key_exists($row2->pageTypeName, $keys)) continue;
                        $row->pageTypes[] = PageType::fromParentRs($row2);
                        $keys[$row2->pageTypeName] = 1;
                    }
                    //
                    if (!isset($row->activeTheme) && $row2->themeName)
                        $row->activeTheme = Theme::fromParentRs($row2);
                    return $row;
                }
            })
            ->fetchAll()[0] ?? null;
    }
}
