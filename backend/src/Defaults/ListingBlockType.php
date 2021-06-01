<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Entities\Block;
use KuuraCms\Page\PagesController;
use Pike\Db;

final class ListingBlockType {
    /**
     * Fetches data for 'dynamic-listing' typed block $for.
     */
    public function fetchData(Block $for, Db $db) {
        // todo use the actual $block->fetchFilters
        $rows = PagesController::tempFetchPages('p.`title` = ?', '<pseudo>', $db);
        $for->__pages = [PagesController::temp2($rows, $db)];
    }
    public function onBeforeRenderPage(array $blocks): array {
        $listingBlocks = [];
        foreach ($blocks as $block) {
            if ($block->type !== Block::TYPE_LISTING)
                continue;
            foreach ($block->__pages as $page)
                $listingBlocks = array_merge($listingBlocks, $page->blocks);
            unset($block->__pages);
        }
        return $listingBlocks;
    }
}
