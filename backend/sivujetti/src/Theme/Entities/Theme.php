<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Sivujetti\JsonUtils;

/**
 * @psalm-import-type StyleChunk from \Sivujetti\Block\Entities\Block
 * @psalm-type StylesBundle {styleChunks: array<int, StyleChunk>, cachedCompiledCss: string, cachedCompiledScreenSizesCssHashes: array<int, string>}
 */
final class Theme extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
    /** @var object[] [{name: string, friendlyName: string, value: {type: "color", value: string[]}}] */
    public array $globalStyles;
    /**
     * @var object
     * @psalm-var StylesBundle
     */
    public object $styles;
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
        $out->styles = (object) [
            "styleChunks" => [],
            "cachedCompiledCss" => "",
            "cachedCompiledScreenSizesCssHashes" => explode(
                ",",
                $row->themeStylesCachedCompiledScreenSizesCssHashes
            ),
        ];
        $out->stylesOrder = [];
        $out->stylesLastUpdatedAt = [0,0,0,0,0];
        $out->__stash = $rows;
        return $out;
    }
    /**
     * @param ?object $stylesRow = null
     * @psalm-param ?object{globalStyleChunkBundlesJson: string, pageStyleChunksJson: string|null} $stylesRow = null
     */
    public function loadStyles(?object $stylesRow = null): void {
        if (!$this->__stash) return;
        $themeRow = $this->__stash[0];
        $this->stylesLastUpdatedAt = array_map(fn($s) => (int)$s, explode(",", $themeRow->themeStylesLastUpdatedAt));

        if ($stylesRow?->globalStyleChunkBundlesJson) {
            $this->globalStyles = JsonUtils::parse($themeRow->themeGlobalStylesJson);
            $this->stylesOrder = [];

            /** @psalm-var object{styleChunks: StyleChunk[], cachedCompiledCss: string}|null */
            $parsed = JsonUtils::parse($stylesRow->globalStyleChunkBundlesJson);
            $this->styles->cachedCompiledCss = $parsed->cachedCompiledCss;

            /** @psalm-var array<int, StyleChunk>|null */
            $parsed2 = $stylesRow->pageStyleChunksJson ? JsonUtils::parse($stylesRow->pageStyleChunksJson) : null;
            $this->styles->styleChunks = $parsed2
                ? [...$parsed->styleChunks, ...$parsed2]
                : $parsed->styleChunks;
        }
        unset($this->themeGlobalStylesJson);
        unset($this->themeStylesCachedCompiledScreenSizesCssHashes);
        $this->__stash = [];
    }
}
