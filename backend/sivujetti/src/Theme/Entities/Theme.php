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
    /** @var array|object {styleChunks: array<int, object{scss: string, scope: {block: string, media: string, layer: string}}>, cachedCompiledScreenSizesCss: array<int, string>, cachedCompiledScreenSizesCssLengths: array<int, int>} */
    public array|object $styles;
    /** @var string[] ["_body_", "j-Text" ...] */
    public array $stylesOrder;
    /** @var int[] An array of unix timestamps */
    public array $stylesLastUpdatedAt;
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
        if (!defined("USE_NEW_RENDER_FEAT")) {
        $out->styles = [];
        } else {
        $out->styles = (object) [
            "styleChunks" => [],
            "cachedCompiledScreenSizesCss" => [],
            "cachedCompiledScreenSizesCssLengths" => array_map(
                fn($s) => (int) $s,
                explode(",", $row->themeStylesCachedCompiledScreenSizesCssLengths)
            ),
        ];
        }
        $out->stylesOrder = [];
        $out->stylesLastUpdatedAt = [0,0,0,0,0];
        $out->__stash = $rows;
        return $out;
    }
    /**
     * @param bool|string|null $arg = null
     */
    public function loadStyles(bool|string|null $arg = null): void {
        if (!$this->__stash) return;
        $row = $this->__stash[0];
        $this->stylesLastUpdatedAt = array_map(fn($s) => (int)$s, explode(",", $row->themeStylesLastUpdatedAt));

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
        $styleChunkBundlesJson = $arg;
        if ($styleChunkBundlesJson) {
            $this->globalStyles = JsonUtils::parse($row->themeGlobalStylesJson);
            $this->stylesOrder = [];

            $parsed = JsonUtils::parse($styleChunkBundlesJson);
            $this->styles->styleChunks = $parsed->styleChunks;
            $this->styles->cachedCompiledScreenSizesCss = $parsed->cachedCompiledScreenSizesCss;
        }
        unset($this->themeGlobalStylesJson);
        unset($this->themeStylesCachedCompiledScreenSizesCssLengths);
        $this->__stash = [];
        }
    }
}
