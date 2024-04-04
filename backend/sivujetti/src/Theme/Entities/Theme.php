<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Pike\Db\NoDupeRowMapper;
use Sivujetti\JsonUtils;

final class Theme extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
    /** @var object[] [{name: string, friendlyName: string, value: {type: "color", value: string[]}}] */
    public array $globalStyles;
    /** @var object[] array<int, {userScss: todo, compiled: [string, string, string, string, string]}|\Sivujetti\Theme\Entities\Style> */
    public array $styles;
    /** @var string[] ["_body_", "j-Text" ...] */
    public array $stylesOrder;
    /** @var int Unix timestamp */
    public int $stylesLastUpdatedAt;
    /** @var object[] */
    private array $__stash;
    /**
     * @param object $row
     * @param object[] $rows
     * @return self
     */
    public static function fromParentRs(object $row, array $rows): Theme {
        $out = new self;
        $out->id = strval($row->themeId);
        $out->name = $row->themeName;
        $out->globalStyles = [];
        $out->styles = [];
        $out->stylesOrder = [];
        $out->stylesLastUpdatedAt = 0;
        $out->__stash = $rows;
        return $out;
    }
    /**
     * @param bool|\Closure $arg $arg full|loader
     */
    public function loadStyles(bool|\Closure $arg = null): void {
        if (!$this->__stash) return;
        $row = $this->__stash[0];
        $this->stylesLastUpdatedAt = (int) $row->themeStylesLastUpdatedAt;

        if (!defined("USE_NEW_RENDER_FEAT")) {
        $full = $arg;
        if ($full) {
            $this->globalStyles = JsonUtils::parse($row->themeGlobalStylesJson);
            $this->stylesOrder = JsonUtils::parse($row->themeStylesOrderJson);
            //
            $this->styles = NoDupeRowMapper::collectOnce($this->__stash, fn($row2) =>
                strval($row2->themeId) === $this->id ? Style::fromParentRs($row2) : null
            , "themeStylesBlockTypeName", []);
            $ordinals = array_flip($this->stylesOrder); // ["_body_","j-Text"...] => ["_body_"=>0,"j-Text"=>1...]
            usort($this->styles, fn($a, $b) =>
                ($ordinals[$a->blockTypeName] ?? PHP_INT_MAX) <=> ($ordinals[$b->blockTypeName] ?? PHP_INT_MAX)
            );
            //
        }
        unset($this->themeGlobalStylesJson);
        unset($this->themeStylesOrderJson);
        unset($this->themeStylesUnitsJson);
        $this->__stash = [];
        } else {
        $loader = $arg;
        if ($loader) {
            $this->globalStyles = JsonUtils::parse($row->themeGlobalStylesJson);
            $this->stylesOrder = [];
            //
            $this->styles = [(object) [
                "userScss" => (array) JsonUtils::parse($row->themeStylesStyleChunksJson),
                "compiled" => [
                    $loader("all", $this->name),
                    $loader("960", $this->name),
                    $loader("840", $this->name),
                    $loader("600", $this->name),
                    $loader("480", $this->name),
                ],
            ]];
        }
        unset($this->themeGlobalStylesJson);
        unset($this->themeStylesStyleChunksJson);
        $this->__stash = [];
        }
    }
}
