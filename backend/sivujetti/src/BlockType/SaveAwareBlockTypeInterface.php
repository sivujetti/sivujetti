<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\Injector;

/**
 * @phpstan-type RawStorableBlock object{type: string, title: string, renderer: string, id: string, children: array, propsData: list<object{key: string, value: string}>, styleClasses: string}
 */
interface SaveAwareBlockTypeInterface {
    /**
     * @param bool $isInsert
     * @param RawStorableBlock $storableBlock
     * @param \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param \Pike\Injector $di
     */
    public function onBeforeSave(bool $isInsert,
                                 object $storableBlock,
                                 BlockTypeInterface $blockType,
                                 Injector $di): void;
}
