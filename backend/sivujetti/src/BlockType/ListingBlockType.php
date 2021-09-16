<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\ArrayUtils;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\PagesRepository;
use Sivujetti\TheWebsite\Entities\TheWebsite;

class ListingBlockType implements BlockTypeInterface, ListeningBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("listPageType", $builder::DATA_TYPE_TEXT)
            ->newProperty("listFilters", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   PagesRepository $pagesRepo,
                                   TheWebsite $theWebsite): void {
        if (!($blockType instanceof ListingBlockType)) return;
        $filters = json_decode($block->listFilters, true, JSON_THROW_ON_ERROR);
        $block->__pages = $pagesRepo->getMany($block->listPageType, ...$filters);
        $block->__pageType = ArrayUtils::findByKey($theWebsite->pageTypes, $block->listPageType, "name");
    }
}