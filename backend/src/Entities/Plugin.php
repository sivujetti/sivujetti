<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class Plugin {
    /** @var string */
    public string $name;
    /** @var bool */
    public bool $isInstalled;
    /**
     * @param object $row
     * @return self
     */
    static function fromParentRs(object $row): Plugin {
        $out = new self;
        $out->name = $row->pluginName;
        $out->isInstalled = true;
        return $out;
    }
}
