<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\PagesRepository;
use Sivujetti\TheWebsite\Entities\TheWebsite;

interface ListeningBlockTypeInterface {
    /**
     * @param \Sivujetti\Block\Entities\Block $block
     * @param \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   PagesRepository $pagesRepo,
                                   TheWebsite $theWebsite): void;
}
