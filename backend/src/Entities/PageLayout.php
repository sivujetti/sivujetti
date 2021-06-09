<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class PageLayout {
    /** @var string */
    public string $friendlyName;
    /** @var string */
    public string $relFilePath;
    /** @var string[] */
    public array $sections;
    /** @var bool */
    public bool $isDefault;
}
