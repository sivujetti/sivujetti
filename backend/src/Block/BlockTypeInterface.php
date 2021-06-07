<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\Entities\BlockProperties;

interface BlockTypeInterface {
    public function getTemplates(): array;
    /** Tells KuuraCms how persist and validate data */
    public function defineProperties(): BlockProperties;
}
