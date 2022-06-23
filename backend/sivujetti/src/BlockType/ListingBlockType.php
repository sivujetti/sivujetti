<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\{ArrayUtils, Injector, PikeException};
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\PagesRepository2;
use Sivujetti\TheWebsite\Entities\TheWebsite;

class ListingBlockType implements BlockTypeInterface, ListeningBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("filterPageType", $builder::DATA_TYPE_TEXT)
            ->newProperty("filterLimit", $builder::DATA_TYPE_UINT)
            ->newProperty("filterLimitType", $builder::DATA_TYPE_TEXT)
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
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
    */
    public function doPerformBeforeRender(Block $block,
                                          PagesRepository2 $pagesRepo,
                                          TheWebsite $theWebsite): void {
        $q = $pagesRepo->fetch($block->filterPageType, ["@own"]);
        if ($block->filterAdditional !== "{}")
            $q = $q->mongoWhere($block->filterAdditional);
        if ($block->filterLimit)
            $q = $q->limit($block->filterLimit);
        if ($block->filterOrder)
            $q = $q->orderBy(match($block->filterOrder) {
                "desc" => "p.`id` DESC",
                "asc" => "p.`id` ASC",
                "rand" => "RANDOM()",
                default => throw new PikeException("Sanity", PikeException::BAD_INPUT),
            });
        $block->__pages = $q->fetchAll();
        $block->__pageType = ArrayUtils::findByKey($theWebsite->pageTypes, $block->filterPageType, "name");
    }
}
