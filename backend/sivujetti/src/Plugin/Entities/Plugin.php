<?php declare(strict_types=1);

namespace Sivujetti\Plugin\Entities;

final class Plugin extends \stdClass {
    /** @var string e.g. "TomsCoolPlugin", has passed \Pike\Validation::isIdentifier() */
    public string $name;
    /** @var bool When false, this plugin will be ignored on page load */
    public bool $isActive;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): Plugin {
        $out = new self;
        $out->name = $row->pluginName;
        $out->isActive = (bool) $row->pluginIsActive;
        return $out;
    }
}
