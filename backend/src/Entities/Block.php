<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class Block extends \stdClass {
    public const TYPE_HEADING = 0;
    public const TYPE_PARAGRAPH = 1;
    public const TYPE_FORMATTED_TEXT = 2;
    /** @var int self::TYPE_* */
    public int $type;
    /** @var string e.g. 'main', 'sidebar' */
    public string $slot;
    /** @var string e.g. 'MyTag', 'file-name' */
    public string $renderer;

    /* If self::TYPE_HEADING
    public string $text;
    public int $level; */

    /* If self::TYPE_PARAGRAPH
    public string $text; */

    /* If self::TYPE_FORMATTED_TEXT
    public string $html; */
}
