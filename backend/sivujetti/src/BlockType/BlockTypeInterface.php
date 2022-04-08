<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

interface BlockTypeInterface {
    /**
     * @param \Sivujetti\BlockType\PropertiesBuilder $builder
     * @return \ArrayObject<int, \Sivujetti\BlockType\Entities\BlockProperty>
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject;
}
