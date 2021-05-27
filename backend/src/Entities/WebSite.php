<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class WebSite {
    /** @var string e.g. 'My site' */
    public string $name;
    /** @var string e.g. 'fi', 'en' */
    public string $lang;
}
