<?php declare(strict_types=1);

namespace KuuraCms\Page\Entities;

final class PageLayout {
    /** @var string */
    public string $friendlyName;
    /** @var string */
    public string $relFilePath;
    /** @var \KuuraCms\Block\Entities\Block[] */
    public array $initialBlocks;
    /** @var bool */
    public bool $isDefault;
}
