<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Sivujetti\{Template, ValidationUtils};
use Sivujetti\Block\Entities\Block;

final class SiteAwareTemplate extends Template {
    /** @var object[] */
    private array $__cssFiles;
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @param ?array<int, object> $cssFiles = null
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $cssFiles = null) {
        parent::__construct($file, $vars);
        $this->__cssFiles = $cssFiles ?? [];
    }
    /**
     * @param string $name
     * @param mixed $props = null
     * @return string
     */
    public function partial(string $name, $props = null): string {
        $templateFilePath = null;
        if (!str_contains($name, ":")) {
            ValidationUtils::checkIfValidaPathOrThrow($name, strict: true);
            $templateFilePath = "{$this->__dir}{$name}.tmpl.php";
        } else
            $templateFilePath = self::completePath($name) . ".tmpl.php";
        //
        return $this->doRender($templateFilePath,
            array_merge($this->__locals, ["props" => $props]));
    }
    /**
     * @param string $url
     * @param bool $withIndexFile = true
     * @return string
     */
    public function url(string $url, bool $withIndexFile = true): string {
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
     * @param \Sivujetti\Block\Entities\Block $block
     * @return string
     */
    public function renderChildren(Block $block): string {
        if (!$block->children) return "";
        return $block->children[0]->type !== "__marker"
            ? $this->renderBlocks($block->children)
            : "<span id=\"temp-marker\"></span>";
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $blocks
     * @return string
     */
    public function renderBlocks(array $blocks): string {
        $out = "";
        foreach ($blocks as $block)
            $out .= "<!-- block-start {$block->id}:{$block->type} -->" .
                $this->partial($block->renderer, $block) . "<!-- block-end {$block->id} -->";
        return $out;
    }
    /**
     * @return string
     */
    public function cssFiles(): string {
        return implode(" ", array_map(function ($f) {
            $attrsMap = $f->attrs;
            if (!array_key_exists("rel", $attrsMap)) $attrsMap["rel"] = "stylesheet";
            return "<link href=\"{$this->assetUrl("public/{$this->e($f->url)}")}\"" .
                self::attrMapToStr($attrsMap) . ">";
        }, $this->__cssFiles));
    }
    /**
     * ['id' => 'foo', 'class' => 'bar'] -> ' id="foo" class="bar"'
     *
     * @param array|object $map
     * @return string
     */
    private static function attrMapToStr(array|object $map): string {
        $pairs = [];
        foreach ($map as $key => $val) $pairs[] = " {$key}=\"{$val}\"";
        return htmlspecialchars(implode("" , $pairs), ENT_NOQUOTES);
    }
}