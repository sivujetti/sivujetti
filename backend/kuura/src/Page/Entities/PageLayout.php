<?php declare(strict_types=1);

namespace KuuraCms\Page\Entities;

final class PageLayout {
    /** @var string */
    public string $id;
    /** @var string */
    public string $friendlyName;
    /** @var string */
    public string $relFilePath;
    /** @var \Closure fn(): \KuuraCms\Block\Entities\Block[] */
    public \Closure $getInitialBlocks;
    /** @var bool */
    public bool $isDefault;
}
