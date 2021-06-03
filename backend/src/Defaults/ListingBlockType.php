<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Entities\Block;
use KuuraCms\Entities\BlockProperties;
use KuuraCms\Page\Todo;

final class ListingBlockType implements BlockTypeInterface {
    /**
     * Fetches data for 'dynamic-listing' typed block $for.
     */
    public function fetchData(Block $for, Todo $paegRepo) {
        // todo use the actual $block->fetchFilters
        $rows = $paegRepo->tempFetchPages('p.`title` = ?', '<pseudo>');
        $for->__pages = $paegRepo->temp3($rows);
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
    // todo add separate interface for dynamic blocks?
    public function getDefaultRenderer(): string {
        return 'auto';
    }
    public function defineProperties(): BlockProperties {
        return new BlockProperties;
    }
}
