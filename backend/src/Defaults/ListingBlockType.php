<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Entities\{Block, BlockProperties, BlockProperty};
use KuuraCms\Page\Todo;
use Pike\ArrayUtils;
use Pike\PikeException;

final class ListingBlockType implements BlockTypeInterface
{
    /**
     * Fetches data for 'dynamic-listing' -typed block $for.
     */
    public function fetchData(Block $for, Todo $paegRepo): void
    {
        // {"$all": {"$eq": {"pageType": "Services"}}}
        $rows = $paegRepo->tempFetch(json_decode($for->fetchFilters)->{'$all'}->{'$eq'}->pageType);
        $for->__pages = $paegRepo->temp3($rows);
    }
    public function onBeforeRenderPage(array $blocks): array
    {
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
    public function getDefaultRenderer(): string
    {
        return 'kuura:auto';
    }
    public function defineProperties(): BlockProperties
    {
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->name = 'fetchFilters';
        $p1->dataType = 'text';
        $out[] = $p1;
        return $out;
    }
}
