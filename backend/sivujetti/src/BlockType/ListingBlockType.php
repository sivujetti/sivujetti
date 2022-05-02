<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\{ArrayUtils, Injector};
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\PagesRepository;
use Sivujetti\TheWebsite\Entities\TheWebsite;

class ListingBlockType implements BlockTypeInterface, ListeningBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("filterPageType", $builder::DATA_TYPE_TEXT)
            ->newProperty("filterLimit", $builder::DATA_TYPE_UINT)
            ->newProperty("filterOrder", $builder::DATA_TYPE_TEXT)
            ->newProperty("filterAdditional", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   Injector $di): void {
        $di->execute([$this, "doPerformBeforeRender"], [
            ":block" => $block,
        ]);
    }
    /**
     * @param \Sivujetti\Block\Entities\Block $block
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
    */
    public function doPerformBeforeRender(Block $block,
                                          PagesRepository $pagesRepo,
                                          TheWebsite $theWebsite): void {
        $filters = [
            "filters" => [],
            "order" => $block->filterOrder,
            "limit" => $block->filterLimit,
        ];
        if (($additional = json_decode($block->filterAdditional, flags: JSON_THROW_ON_ERROR))) {
            ; // Not implemented yet
        }
        // @allow \Pike\PikeException (if filterPageType does not exist)
        $block->__pages = $pagesRepo->getMany($block->filterPageType,
                                              $theWebsite->activeTheme->id,
                                              $filters);
        $block->__pageType = ArrayUtils::findByKey($theWebsite->pageTypes, $block->filterPageType, "name");
    }
}
