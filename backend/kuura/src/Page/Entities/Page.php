<?php declare(strict_types=1);

namespace KuuraCms\Page\Entities;

final class Page {
    public const STATUS_PUBLISHED = 0;
    /** @var string */
    public string $slug;
    /** @var string */
    public string $path;
    /** @var int 1 = top level, 2 = 2nd. level etc. */
    public int $level;
    /** @var string */
    public string $title;
    /** @var string */
    public string $layoutId;
    /** @var string */
    public string $id;
    /** @var string */
    public string $type;
    /** @var \KuuraCms\Block\Entities\Block[] */
    public array $blocks;
    /** @var int self::STATUS_* */
    public int $status;
    /** @var object */
    public object $layout;
}
