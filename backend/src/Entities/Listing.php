<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class Listing {
    public array $pages;
    public string $slot; // see \KuuraCms\Entities\Block->slot
    public string $renderer; // see \KuuraCms\Entities\Block->renderer
}
