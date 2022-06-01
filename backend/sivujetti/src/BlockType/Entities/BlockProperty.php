<?php declare(strict_types=1);

namespace Sivujetti\BlockType\Entities;

final class BlockProperty {
    public const DATA_TYPE_TEXT = "text";
    public const DATA_TYPE_UINT = "uint";
    /** @var string */
    public string $name;
    /** @var object {type: self::DATA_TYPE_*, isNullable: bool, length?: int, validationRules?: array} */
    public object $dataType;
}
