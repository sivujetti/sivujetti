<?php declare(strict_types=1);

namespace KuuraCms\Page\Entities;

final class Page {
    public const TYPE_PAGE = 'Pages';
    public string $slug;
    public string $title;
    public string $layoutId;
    public string $id;
    public string $type;
    public array $blocks;
}
