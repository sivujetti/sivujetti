<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Auryn\Injector;
use Sivujetti\Block\Entities\Block;

interface ListeningBlockTypeInterface {
    /**
     * @param \Sivujetti\Block\Entities\Block $block
     * @param \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param \Auryn\Injector $di
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   Injector $di): void;
}
