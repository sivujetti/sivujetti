<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\Injector;
use Sivujetti\Block\Entities\Block;

interface RenderAwareBlockTypeInterface {
    /**
     * @param \Sivujetti\Block\Entities\Block $block
     * @param \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param \Pike\Injector $di
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   Injector $di): void;
}
