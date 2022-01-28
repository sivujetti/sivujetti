<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Auryn\Injector;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository;

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
        $entry = $di->make(GlobalBlockTreesRepository::class)
            ->getSingle($block->globalBlockTreeId);
        $block->__globalBlockTree = $entry;
    }
}
