<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

interface BlockTypeInterface {
    /**
     * @return \KuuraCms\BlockType\Entities\BlockProperty[]
     */
    public function defineProperties(): \ArrayObject;
}
