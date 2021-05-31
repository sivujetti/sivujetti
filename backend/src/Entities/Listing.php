<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class Listing {
    /** @var \KuuraCms\Entities\Page[] */
    public array $pages;
    /** @var string @see \KuuraCms\Entities\Block->section */
    public string $section;
    /** @var string @see \KuuraCms\Entities\Block->renderer */
    public string $renderer;
}
