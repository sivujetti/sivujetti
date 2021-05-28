<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Entities\{Block, Page};
use Pike\{ArrayUtils, Template as PikeTemplate};

final class Template extends PikeTemplate {
    /**
     * @param string $str
     * @param int $flags = ENT_QUOTES | ENT_HTML5
     * @param bool $doubleEncode = true
     * @return string
     */
    public static function e(string $str,
                             int $flags = ENT_QUOTES | ENT_HTML5,
                             bool $doubleEncode = true): string {
        return htmlspecialchars($str, $flags, 'UTF-8', $doubleEncode);
    }
    /**
     * @param string $url
     * @param bool $withIndexFile = true
     * @return string
     */
    public static function url(string $url, bool $withIndexFile = true): string {
        return self::makeUrl($url, $withIndexFile);
    }
    /**
     * @param string $url
     * @return string
     */
    public function assetUrl(string $url): string {
        return self::makeUrl($url, false);
    }
    /**
     * @param @todo
     * @return @todo
     */
    public function uploadsUrl(string $url): string {
        return $this->assetUrl("uploads/$url");
    }
    /**
     * @param string $url
     * @param bool $withIndexFile = true
     * @return string
     */
    public static function makeUrl(string $url, bool $withIndexFile = true): string {
        static $indexFile = !KUURA_QUERY_VAR ? '' : ('index.php?' . KUURA_QUERY_VAR . '=/');
        if (!$withIndexFile || !$indexFile) return KUURA_BASE_URL . self::e(ltrim($url, '/'));
        // '/path?myvar=val' -> 'index.php?q=/path&myvar=val'
        $info = parse_url(self::e(ltrim($url, '/')));
        return KUURA_BASE_URL .
            $indexFile .
            ($info['path'] ?? '') .
            (isset($info['query']) ? '&amp;' . $info['query'] : '') .
            (isset($info['fragment']) ? '#' . $info['fragment'] : '');
    }
    /**
     * @param @todo
     * @return @todo
     */
    public function cssFiles(): string {
        return '';
    }
    /**
     * @param string $name
     * @param array $args
     * @return string
     */
    public function __call($name, $args) {
        ValidationUtils::checkIfValidaPathOrThrow($name, true);
        $filePath = "{$this->__dir}{$name}.tmpl.php";
        return $this->doRender($filePath,
            $this->__locals + ['props' => $args ? $args[0] : []]);
    }
    /**
     * @todo
     * @return string
     */
    protected function renderBlocks(array $blocks): string {
        $out = '';
        foreach ($blocks as $blockOrListing)
            $out .= $this->renderValue($this->__call($blockOrListing->renderer, [(object) $blockOrListing]),
                                       $blockOrListing);
        return $out;
    }
    /**
     * @todo
     * @todo
     * @return string
     */
    protected function filterBlocks(Page $page, string $slotName): array {
        return ArrayUtils::filterByKey($page->blocks, $slotName, 'slot');
    }
    /**
     * @todo
     * @todo
     * @return string
     */
    protected function renderValue(string $value, Block $block): string {
        return "<!-- block-start " . json_encode(self::dumpBlock($block)) .
            " -->{$value}<!-- block-end {$block->id} -->";
    }
    private static function dumpBlock(Block $block): object {
        return (object) [
            'type' => $block->type,
            'renderer' => $block->renderer,
            'id' => $block->id,
        ];
    }
}
