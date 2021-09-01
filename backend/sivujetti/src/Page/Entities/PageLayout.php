<?php declare(strict_types=1);

namespace Sivujetti\Page\Entities;

final class PageLayout {
    /** @var string */
    public string $id;
    /** @var string */
    public string $friendlyName;
    /** @var string */
    public string $relFilePath;
    /** @var bool */
    public bool $isDefault;
}
