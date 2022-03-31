<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Auryn\Injector;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class GlobalBlockReferenceBlockType implements BlockTypeInterface,
                                                     ListeningBlockTypeInterface {
    public const EMPTY_OVERRIDES = "{}";
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("globalBlockTreeId", $builder::DATA_TYPE_TEXT)
            ->newProperty("overrides", $builder::DATA_TYPE_TEXT)
            ->newProperty("useOverrides", $builder::DATA_TYPE_UINT)
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
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $gbtRepo
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
    */
    public function doPerformBeforeRender(Block $block,
                                          GlobalBlockTreesRepository $gbtRepo,
                                          TheWebsite $theWebsite): void {
        $entry = $gbtRepo->getSingle($block->globalBlockTreeId,
                                     $theWebsite->activeTheme->id);
        $block->__globalBlockTree = $entry;
    }
}
