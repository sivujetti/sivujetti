<?php declare(strict_types=1);

namespace KuuraCms\BlockType\Entities;

final class BlockProperty {
    public const DATA_TYPE_TEXT = "text";
    /** @var string */
    public string $name;
    /** @var string self::DATA_TYPE_* */
    public string $dataType;
}
