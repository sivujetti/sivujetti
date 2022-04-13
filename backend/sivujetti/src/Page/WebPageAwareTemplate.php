<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, PikeException};
use Sivujetti\{Template, ValidationUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Theme\Entities\Theme;
use Sivujetti\Theme\ThemeCssFileUpdaterWriter;

final class WebPageAwareTemplate extends Template {
    /** @var ?object */
    private ?object $__cssAndJsFiles;
    /** @var \Sivujetti\Theme\Entities\Theme */ 
    private ?Theme $__theme;
    /** @var object[] [{blockId: string, styles: string}] */
    private array $__blockStyles;
    /** @var array<string, object[]> array<string, array<int, {blockId: string, styles: string}>> */
    private array $__dynamicGlobalBlockTreeBlocksStyles;
    /** @var bool */
    private bool $__useInlineCssStyles;
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @param ?array<string, mixed> $initialLocals = null
     * @param ?object $cssAndJsFiles = null
     * @param ?\Sivujetti\Theme\Entities\Theme $theme = null
     * @param ?array<int, object> $blockStyles = null
     * @param ?bool $useInlineCssStyles = null
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $initialLocals = null,
                                ?object $cssAndJsFiles = null,
                                ?Theme $theme = null,
                                ?array $blockStyles = null,
                                ?bool $useInlineCssStyles = null) {
        parent::__construct($file, $vars, $initialLocals);
        $this->__cssAndJsFiles = $cssAndJsFiles;
        $this->__theme = $theme;
        $this->__blockStyles = $blockStyles ?? [];
        $this->__dynamicGlobalBlockTreeBlocksStyles = [];
        $this->__useInlineCssStyles = $useInlineCssStyles ?? true;
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
                    : $this->renderBlocks($this->getMutatedGlobalTreeBlocks($block))) .
            "<!-- block-end {$block->id} -->";
        return $out;
    }
    /**
     * Note: mutates $block->__blobalBlockTree->blocks*->* and $this->__dynamicGlobalBlockTreeBlocksStyles
     *
     * @param \Sivujetti\Block\Entities\Block $globalBlockRef
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private function getMutatedGlobalTreeBlocks(Block $globalBlockRef): array {
        $overrides = $globalBlockRef->overrides;
        $gbt = $globalBlockRef->__globalBlockTree;
        $blocks = $gbt->blocks;
        //
        if ($gbt->blockStyles)
            $this->__dynamicGlobalBlockTreeBlocksStyles["_{$gbt->id}"] = $gbt->blockStyles;
        //
        if ($overrides === GlobalBlockReferenceBlockType::EMPTY_OVERRIDES)
            return $blocks;
        foreach (json_decode($overrides, flags: JSON_THROW_ON_ERROR) as $blockId => $perBlockPropOverrides) {
            $blockToOverride = BlockTree::findBlockById($blockId, $blocks);
            foreach ($perBlockPropOverrides as $key => $val) {
                $blockToOverride->{$key} = $val;
                $default = ArrayUtils::findByKey($blockToOverride->propsData, $key, "key");
                $default->value = $val;
            }
        }
        //
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
        $rf = function ($f) {
            $attrsMap = $f->attrs;
            if (!array_key_exists("rel", $attrsMap)) $attrsMap["rel"] = "stylesheet";
            return "<link href=\"{$this->assetUrl("public/{$this->e($f->url)}")}\"" .
                $this->attrMapToStr($attrsMap) . ">";
        };
        // Global variables
        $out = "<style>:root {" .
            implode("\n", array_map(fn($style) =>
                // Note: these are pre-validated
                "    --{$style->name}: {$this->cssValueToString($style->value)};"
            , $this->__theme->globalStyles)) .
        "}</style>\n";
        //
        if (!$this->__useInlineCssStyles) {
            /*
            []         -> [gen]
            [b1]       -> [b1,gen]
            [b1,b2]    -> [b1,gen,b2]
            [b1,b2,b3] -> [b1,b2,gen,b3]
            */
            $generated = (object) ["url" => "{$this->__theme->name}-generated.css?t=" . time(),
                                   "attrs" => []];
            if (count($this->__cssAndJsFiles->css) < 2) {
                $this->__cssAndJsFiles->css[] = $generated;
            } else {
                $secondLast = count($this->__cssAndJsFiles->css) - 1;
                array_splice($this->__cssAndJsFiles->css, $secondLast, 0, [$generated]);
            }
            return $out . implode("\n", array_map($rf,
                $this->__cssAndJsFiles->css
            ));
        }
        return $out . (
            // External files
            implode("\n", array_map($rf, $this->__cssAndJsFiles->css)) .
            //
            "\n<!-- Note to devs: these inline styles appear here only when you're logged in -->\n" .
            // Inject each style bundle via javascript instead of echoing them directly (to
            // allow things such `content: "</style>"` or `/* </style> */`)
            "<script>document.head.appendChild([\n" .
                // Base styles for each block type
                json_encode(array_map(fn($styles) => (object) [
                    "css" => base64_encode(ThemeCssFileUpdaterWriter::compileBlockTypeBaseCss($styles)), "type" => "block-type", "id" => $styles->blockTypeName,
                ], $this->__theme->blockTypeStyles)) . ",\n" .
                // Styles for this page's global block tree blocks
                "'<!-- ::editModeGlobalBlockStylesPlaceholder:: -->',\n" .
                // Styles for this page's blocks
                self::renderEditModeBlockStyles($this->__blockStyles) . ",\n" .
            "].flat().reduce((out, {css, type, id}) => {\n" .
                "const bundle = document.createElement('style');\n" .
                "bundle.innerHTML = atob(css);\n" .
                "bundle.setAttribute(`data-styles-for-\${type}`, id);\n" .
                "out.appendChild(bundle);\n" .
                "return (out);\n" .
            "}, document.createDocumentFragment()))</script>"
        );
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
     * @inheritdoc
     */
    public function render(array $locals = []): string {
        // First pass
        $output = parent::render($locals);
        // Seconds pass
        if ($this->__useInlineCssStyles)
            return str_replace(
                "'<!-- ::editModeGlobalBlockStylesPlaceholder:: -->'",
                $this->__dynamicGlobalBlockTreeBlocksStyles ? implode(",\n", array_map(fn($styles) =>
                    self::renderEditModeBlockStyles($styles)
                , $this->__dynamicGlobalBlockTreeBlocksStyles)) : "[]",
                $output
            );
        return $output;
    }
    /**
     * @return object[] {globalBlockTreeId: string, styles: array<int, {blockId: string, styles: string}>}[]
     */
    public function getGlobalBlockStyles(): array {
        $out = [];
        foreach ($this->__dynamicGlobalBlockTreeBlocksStyles as $globalBlockTreeId => $styles)
            $out[] = (object) ["globalBlockTreeId" => substr($globalBlockTreeId, 1), "styles" => $styles];
        return $out;
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
            default => throw new PikeException("Bad variable", PikeException::BAD_INPUT),
        };
    }
    /**
     * @param object[] $styles [{blockId: string, styles: string}]
     * @return string `[{"css":<base64EncodedCss>,"type":"block","id":<blockId>}...]`
     */
    private static function renderEditModeBlockStyles(array $stylesAll): string {
        return json_encode(array_map(fn($styles) => (object) [
            "css" => base64_encode(ThemeCssFileUpdaterWriter::compileBlockCss($styles)), "type" => "block", "id" => $styles->blockId,
        ], $stylesAll));
    }
}
