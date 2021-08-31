<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\PagesRepository;

interface ListeningBlockTypeInterface {
    /**
     * @param \Sivujetti\Block\Entities\Block $block
     * @param \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   PagesRepository $pagesRepo): void;
}
