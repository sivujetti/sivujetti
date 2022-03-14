<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, PikeException};
use Sivujetti\{Template, ValidationUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Theme\Entities\Theme;

final class WebPageAwareTemplate extends Template {
    /** @var ?object */
    private ?object $__cssAndJsFiles;
    /** @var \Sivujetti\Theme\Entities\Theme */
    private ?Theme $__theme;
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @param ?array<string, mixed> $initialLocals = null
     * @param ?object $cssAndJsFiles = null
     * @param ?\Sivujetti\Theme\Entities\Theme $theme = null
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $initialLocals = null,
                                ?object $cssAndJsFiles = null,
                                ?Theme $theme = null,
                                ?array $blockStyles = null,
                                ?bool $doUseEditableStyles = null) {
        parent::__construct($file, $vars, $initialLocals);
        $this->__cssAndJsFiles = $cssAndJsFiles;
        $this->__theme = $theme;
    }
    /**
     * @param string $name
     * @param mixed $props = null
     * @return string
     */
    public function partial(string $name, mixed $props = null): string {
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
    public function maybeExternalUrl(string $url): string {
        return !str_contains($url, ".")
            ? $this->makeUrl($url)
            : (((str_starts_with($url, "//") || str_starts_with($url, "http")) ? "" : "//") . $url);
    }
    /**
     * @param string $url
     * @return string
     */
    public function assetUrl(string $url): string {
        return self::makeUrl($url, false);
    }
    /**
     * @param string $str
     * @param mixed ...$args
     * @return string
     */
    public function __(string $str, ...$args): string {
        return $this->e(!$args ? $str : sprintf($str, ...$args));
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
                ($block->type !== Block::TYPE_GLOBAL_BLOCK_REF
                    ? $this->partial($block->renderer, $block)
                    : $this->renderBlocks(self::getMutatedGlobalTreeBlocks($block))) .
            "<!-- block-end {$block->id} -->";
        return $out;
    }
    /**
     * Note: mutates $block->__blobalBlockTree->blocks*->*
     *
     * @param \Sivujetti\Block\Entities\Block $globalBlockRef
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private static function getMutatedGlobalTreeBlocks(Block $globalBlockRef): array {
        $overrides = $globalBlockRef->overrides;
        $blocks = $globalBlockRef->__globalBlockTree?->blocks ?? [];
        if ($overrides === GlobalBlockReferenceBlockType::EMPTY_OVERRIDES || !$blocks) return $blocks;
        //
        foreach (json_decode($overrides, flags: JSON_THROW_ON_ERROR) as $blockId => $perBlockPropOverrides) {
            $blockToOverride = BlockTree::findBlockById($blockId, $blocks);
            foreach ($perBlockPropOverrides as $key => $val) {
                $blockToOverride->{$key} = $val;
                $default = ArrayUtils::findByKey($blockToOverride->propsData, $key, "key");
                $default->value = $val;
            }
        }
        return $blocks;
    }
    /**
     * @see \Sivujetti\Block\BlockTree::findBlock()
     */
    public function findBlock(array $branch, callable $predicate): ?Block {
        return BlockTree::findBlock($branch, $predicate);
    }
    /**
     * @return string
     */
    public function cssFiles(): string {
        if (!$this->__cssAndJsFiles)
            return "";
        // External files
        return implode(" ", array_map(function ($f) {
            $attrsMap = $f->attrs;
            if (!array_key_exists("rel", $attrsMap)) $attrsMap["rel"] = "stylesheet";
            return "<link href=\"{$this->assetUrl("public/{$this->e($f->url)}")}\"" .
                $this->attrMapToStr($attrsMap) . ">";
        }, $this->__cssAndJsFiles->css)) .
        // Global variables
        "<style>:root {" .
            implode("", array_map(fn($style) =>
                // Note: these are pre-validated
                "    --{$style->name}: {$this->cssValueToString($style->value)};"
            , $this->__theme->globalStyles)) .
        "}</style>" .
        // Base styles for each block type
        implode("", array_map(function ($style)  {
            return "<style data-styles-for-block-type=\"{$style->blockTypeName}\">" .
                "[data-block-type=\"{$style->blockTypeName}\"] {$style->styles}" .
            "</style>";
        }, $this->__theme?->blockTypeStyles ?? []));
    }
    /**
     * @return string
     */
    public function jsFiles(): string {
        if (!$this->__cssAndJsFiles)
            return "";
        return implode(" ", array_map(function ($f) {
            $attrsMap = $f->attrs;
            $pre = $f->url !== "sivujetti/sivujetti-commons-for-web-pages.js"
                ? ""
                : "<script>window.sivujettiBaseUrl='{$this->makeUrl("/", true)}';
                           window.sivujettiAssetBaseUrl='{$this->makeUrl("/", false)}';</script>";
            return "{$pre}<script src=\"{$this->assetUrl("public/{$this->e($f->url)}")}\"" .
                $this->attrMapToStr($attrsMap) . "></script>";
        }, $this->__cssAndJsFiles->js));
    }
    /**
     * ["id" => "foo", "class" => "bar"] -> ' id="foo" class="bar"'
     *
     * @param array<string, string>|object $map
     * @return string
     */
    protected function attrMapToStr(array|object $map): string {
        $pairs = [];
        foreach ($map as $key => $val) $pairs[] = " {$key}=\"{$val}\"";
        return $this->e(implode("", $pairs), ENT_NOQUOTES);
    }
    /**
     * @param object $value {type: "color", value: ["00","00","00","00"]}
     * @return string
     */
    protected function cssValueToString(object $value): string {
        return match($value->type) {
            "color" => "#" . implode("", $value->value),
            "default" => throw new PikeException("Bad variable", PikeException::BAD_INPUT),
        };
    }
}
