<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\BlockType\Entities\BlockProperty;

final class PropertiesBuilder {
    public const DATA_TYPE_TEXT = BlockProperty::DATA_TYPE_TEXT;
    public const DATA_TYPE_UINT = BlockProperty::DATA_TYPE_UINT;
    /** @var \ArrayObject<int, \Sivujetti\BlockType\Entities\BlockProperty> */
    private \ArrayObject $props;
    /** @var \Sivujetti\BlockType\Entities\BlockProperty */
    private BlockProperty $head;
    /** */
    public function __construct() {
        $this->props = new \ArrayObject;
    }
    /**
     * @param string $name
     * @param ?string $dataType = null self::DATA_TYPE_*
     * @return $this
     */
    public function newProperty(string $name, ?string $dataType = null): PropertiesBuilder {
        $this->head = new BlockProperty;
        $this->head->name = $name;
        if ($dataType !== null) $this->dataType($dataType);
        $this->props[] = $this->head;
        return $this;
    }
    /**
     * @param string $dataType self::DATA_TYPE_*
     * @param ?int $length = null
     * @param ?array $validationRules = null
     * @return $this
     */
    public function dataType(string $type,
                             ?int $length = null,
                             ?array $validationRules = null): PropertiesBuilder {
        $this->head->dataType = (object) [
            "type" => $type,
            "length" => $length,
            "validationRules" => $validationRules
        ];
        return $this;
    }
    /**
     * @return \ArrayObject<int, \Sivujetti\BlockType\Entities\BlockProperty>
     */
    public function getResult(): \ArrayObject {
        return $this->props;
    }
}
