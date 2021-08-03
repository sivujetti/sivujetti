<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

interface BlockTypeInterface {
    /**
     * @param \KuuraCms\BlockType\PropertiesBuilder $builder
     * @return \KuuraCms\BlockType\Entities\BlockProperty[]
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject;
}
