<?php declare(strict_types=1);

namespace Sivujetti\Page\Entities;

use Sivujetti\Layout\Entities\Layout;

final class Page {
    public const STATUS_PUBLISHED = 0;
    public const STATUS_DRAFT = 1;
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
    /** @var \Sivujetti\Block\Entities\Block[] */
    public array $blocks;
    /** @var object[] [{blockId: string, styles: string}] */
    public array $blockStyles;
    /** @var int self::STATUS_* */
    public int $status;
    /** @var \Sivujetti\Layout\Entities\Layout */
    public Layout $layout;
}
