<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\Injector;

/**
 * @psalm-type RawStorableBlock = object{type: string, title: string, renderer: string, id: string, children: array, propsData: array<int, object{key: string, value: string}>, styleClasses: string, styleGroup: string}
 */
interface SaveAwareBlockTypeInterface {
    /**
     * @param bool $isInsert
     * @psalm-param RawStorableBlock $storableBlock
     * @param \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param \Pike\Injector $di
     */
    public function onBeforeSave(bool $isInsert,
                                 object $storableBlock,
                                 BlockTypeInterface $blockType,
                                 Injector $di): void;
}
