<?php declare(strict_types=1);

namespace KuuraCms\Page\Entities;

final class Page {
    /** @var string */
    public string $slug;
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
    /** @var object */
    public object $layout;
}
