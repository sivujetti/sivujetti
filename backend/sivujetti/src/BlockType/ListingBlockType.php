<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Auryn\Injector;
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
            ->newProperty("renderWith", $builder::DATA_TYPE_TEXT)
            ->newProperty("listFilters", $builder::DATA_TYPE_TEXT)
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
        $filters = json_decode($block->listFilters, true, JSON_THROW_ON_ERROR);
        // @allow \Pike\PikeException (if listPageType does not exist)
        $block->__pages = $pagesRepo->getMany($block->listPageType,
                                              $theWebsite->activeTheme->id,
                                              ...$filters);
        $block->__pageType = ArrayUtils::findByKey($theWebsite->pageTypes, $block->listPageType, "name");
    }
}
