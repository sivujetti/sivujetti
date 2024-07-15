<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Sivujetti\JsonUtils;

/**
 * @psalm-import-type StyleChunk from \Sivujetti\Block\Entities\Block
 * @psalm-type StylesBundle {styleChunks: array<int, StyleChunk>, cachedCompiledScreenSizesCss: array<int, string>, cachedCompiledScreenSizesCssHashes: array<int, string>}
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
            "cachedCompiledScreenSizesCss" => [],
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
     * @param ?string $styleChunkBundlesJson = null
     */
    public function loadStyles(?string $styleChunkBundlesJson = null): void {
        if (!$this->__stash) return;
        $row = $this->__stash[0];
        $this->stylesLastUpdatedAt = array_map(fn($s) => (int)$s, explode(",", $row->themeStylesLastUpdatedAt));

        if ($styleChunkBundlesJson) {
            $this->globalStyles = JsonUtils::parse($row->themeGlobalStylesJson);
            $this->stylesOrder = [];

            $parsed = JsonUtils::parse($styleChunkBundlesJson);
            $this->styles->styleChunks = $parsed->styleChunks;
            $this->styles->cachedCompiledScreenSizesCss = $parsed->cachedCompiledScreenSizesCss;
        }
        unset($this->themeGlobalStylesJson);
        unset($this->themeStylesCachedCompiledScreenSizesCssHashes);
        $this->__stash = [];
    }
}
