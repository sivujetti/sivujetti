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
                "ws.`name`", "ws.`lang`", "ws.`country`", "ws.`description`",
                "ws.`aclRules` AS `aclRulesJson`", "ws.`firstRuns` as `firstRunsJson`",
                "p.`name` AS `pluginName`", "p.`isActive` AS `pluginIsActive`",
                "pt.`name` AS `pageTypeName`", "pt.`slug` AS `pageTypeSlug`",
                "pt.`friendlyName` AS `pageTypeFriendlyName`",
                "pt.`friendlyNamePlural` AS `pageTypeFriendlyNamePlural`",
                "pt.`description` AS `pageTypeDescription`",
                "pt.`fields` AS `pageTypeFieldsJson`",
                "pt.`defaultLayoutId` AS `pageTypeDefaultLayoutId`",
                "pt.`status` AS `pageTypeStatus`",
                "pt.`isListable` AS `pageTypeIsListable`",
                "t.`id` AS `themeId`", "t.`name` AS `themeName`", "t.`globalStyles` AS `themeGlobalStylesJson`",
                "tbts.`blockTypeName` AS `themeBlockTypeStylesBlockTypeName`",
                "tbts.`styles` AS `themeBlockTypeStylesStyles`",
                "ts.`units` AS `themeStylesUnits`",
                "ts.`blockTypeName` AS `themeStylesBlockTypeName`",
            ])
            ->leftJoin("\${p}plugins p ON (1)")
            ->leftJoin("\${p}pageTypes pt ON (1)")
            ->leftJoin("\${p}themes t ON (t.`isActive` = 1)")
            ->leftJoin("\${p}themeBlockTypeStyles tbts ON (tbts.`themeId` = t.`id`)")
            ->leftJoin("\${p}themeStyles ts ON (ts.`themeId` = t.`id`)")
            ->orderBy("p.id ASC")
            ->mapWith(new class("name") extends NoDupeRowMapper {
                public function doMapRow(object $row, int $i, array $allRows): object {
                    $row->plugins = self::collectOnce($allRows, fn($row2) => Plugin::fromParentRs($row2), "pluginName");
                    $row->pageTypes = self::collectOnce($allRows, fn($row2) => PageType::fromParentRs($row2), "pageTypeName");
                    $row->activeTheme = Theme::fromParentRs($row, $allRows);
                    return $row;
                }
            })
            ->fetchAll()[0] ?? null;
    }
}
