<?php declare(strict_types=1);

namespace KuuraCms\Entities;

use KuuraCms\ContentType\ContentTypeCollection;

final class TheWebsite {
    /** @var string e.g. 'My site' */
    public string $name;
    /** @var string e.g. 'fi', 'en' */
    public string $lang;
    /** @var string */
    public string $aclRulesJson;
    /** @var \KuuraCms\Entities\Plugin[] */
    public \ArrayObject $plugins;
    /** @var \KuuraCms\ContentType\ContentTypeCollection */
    public ContentTypeCollection $contentTypes;
}
