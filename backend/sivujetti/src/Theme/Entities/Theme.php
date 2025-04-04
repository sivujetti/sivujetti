<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Sivujetti\JsonUtils;

/**
 * @phpstan-import-type StyleChunk from \Sivujetti\Block\Entities\Block
 * @phpstan-type StylesBundle {styleChunks: list<StyleChunk>, cachedCompiledCss: string, cachedCompiledScreenSizesCssHashes: list<string>}
 */
final class Theme extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
    /** @var string JSON form of `list<object{name: string, cssClass: string, color: string|null;}>` */
    public string $miscWysiwygStylesJson;
    /** @var StylesBundle */
    public object $styles;
    /** @var list<int> An array of unix timestamps */
    public array $stylesLastUpdatedAt;
    /** @var list<object> */
    private array $__stash;
    /**
     * @param object $row
     * @param list<object> $rows
     * @return self
     */
    public static function fromParentRs(object $row, array $rows): Theme {
        $out = new self;
        $out->id = strval($row->themeId);
        $out->name = $row->themeName;
        $out->miscWysiwygStylesJson = $row->themeMiscWysiwygStylesJson;
        $out->styles = (object) [
            "styleChunks" => [],
            "cachedCompiledCss" => "",
            "cachedCompiledScreenSizesCssHashes" => explode(
                ",",
                $row->themeStylesCachedCompiledScreenSizesCssHashes
            ),
        ];
        $out->stylesLastUpdatedAt = [0,0,0,0,0];
        $out->__stash = $rows;
        return $out;
    }
    /**
     * @param ?object{globalStyleChunkBundlesJson: string, pageStyleChunksJson: string|null} $stylesRow = null
     */
    public function loadStyles(?object $stylesRow = null): void {
        if (!$this->__stash) return;
        $themeRow = $this->__stash[0];
        $this->stylesLastUpdatedAt = array_map(fn($s) => (int)$s, explode(",", $themeRow->themeStylesLastUpdatedAt));

        if ($stylesRow?->globalStyleChunkBundlesJson) {
            /** @var object{styleChunks: list<StyleChunk>, cachedCompiledCss: string}|null */
            $parsed = JsonUtils::parse($stylesRow->globalStyleChunkBundlesJson);
            $this->styles->cachedCompiledCss = $parsed->cachedCompiledCss;

            /** @var list<StyleChunk>|null */
            $parsed2 = $stylesRow->pageStyleChunksJson ? JsonUtils::parse($stylesRow->pageStyleChunksJson) : null;
            $this->styles->styleChunks = $parsed2
                ? [...$parsed->styleChunks, ...$parsed2]
                : $parsed->styleChunks;
        }
        unset($this->themeStylesCachedCompiledScreenSizesCssHashes);
        $this->__stash = [];
    }
}
