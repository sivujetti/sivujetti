<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, PikeException};
use Sivujetti\{Template, ValidationUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Page\Entities\Page;
use Sivujetti\Theme\Entities\Theme;
use Sivujetti\Theme\ThemeCssFileUpdaterWriter;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class WebPageAwareTemplate extends Template {
    /** @var ?object */
    private ?object $__cssAndJsFiles;
    /** @var \Sivujetti\Theme\Entities\Theme */ 
    private ?Theme $__theme;
    /** @var object[] [{blockId: string, styles: string}] */
    private array $__blocksStyles;
    /** @var string[] */
    private array $__pluginNames;
    /** @var bool */
    private bool $__useInlineCssStyles;
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @param ?array<string, mixed> $initialLocals = null
     * @param ?object $cssAndJsFiles = null
     * @param ?\Sivujetti\Theme\Entities\Theme $theme = null
     * @param ?array<int, object> $blocksStyles = null
     * @param ?array<string> $pluginNames = null
     * @param ?bool $useInlineCssStyles = null
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $initialLocals = null,
                                ?object $cssAndJsFiles = null,
                                ?Theme $theme = null,
                                ?array $blocksStyles = null,
                                ?array $pluginNames = null,
                                ?bool $useInlineCssStyles = null) {
        parent::__construct($file, $vars, $initialLocals);
        $this->__cssAndJsFiles = $cssAndJsFiles;
        $this->__theme = $theme;
        $this->__blocksStyles = $blocksStyles ?? [];
        $this->__dynamicGlobalBlockTreeBlocksStyles = [];
        $this->__useInlineCssStyles = $useInlineCssStyles ?? true;
        $this->__pluginNames = $pluginNames ?? [];
        if ($this->__file === "") $this->__file = $this->completePath($file);
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
            $templateFilePath = "{$this->completePath($name)}.tmpl.php";
        //
        return $this->doRender($templateFilePath,
            array_merge($this->__locals, ["props" => $props]));
    }
    /**
     * @param string $fileId
     * @return string
     * @throws \Pike\PikeException
     */
    private function completePath(string $fileId): string {
        [$ns, $relFilePath] = parent::getFileIdParts($fileId);
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath, strict: false);
        if (str_contains($ns, "/")) {
            $pcs = explode("/", $ns, 2);
            if ($pcs[0] !== "plugins")
                throw new PikeException("Only `plugins` namespace can have multiple levels (you had `{$pcs[0]}`)",
                                        PikeException::BAD_INPUT);
            if (!in_array($pcs[1], $this->__pluginNames, true)) {
                throw new PikeException("No such plugin ({$pcs[1]})",
                                        PikeException::BAD_INPUT);}
            return SIVUJETTI_PLUGINS_PATH . "{$pcs[1]}/templates/{$relFilePath}";
        }
        return parent::getValidPathOrThrow($fileId, allowSubFolders: true);
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
     * @param ?\Sivujetti\Page\Entities\Page $page = null
     * @param ?\Sivujetti\TheWebsite\Entities\TheWebsite $site = null
     * @return string
     */
    public function head(?Page $currentPage = null, ?TheWebsite $site = null): string {
        if (!$currentPage) $currentPage = $this->__locals["currentPage"];
        if (!$site) $site = $this->__locals["site"];
        [$title, $metaMarkup] = $this->__buildSeoMetaMarkup($currentPage, $site);
        // Note: all variables are already escaped
        return "<html lang=\"{$site->lang}\">\n" .
            "<head>\n" .
            "    <meta charset=\"utf-8\">\n" .
            "    <title>{$title}</title>\n" .
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" .
            "    <meta name=\"generator\" content=\"Sivujetti\">\n" .
            "    {$metaMarkup}" .
            "    {$this->cssFiles()}\n" .
            "</head>\n";
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
                // Styles for all global blocks, and this page's blocks
                self::__renderEditModeBlockStyles($this->__blocksStyles) . ",\n" .
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
    private static function __renderEditModeBlockStyles(array $stylesAll): string {
        return json_encode(array_map(fn($styles) => (object) [
            "css" => base64_encode(ThemeCssFileUpdaterWriter::compileBlockCss($styles)),
            "type" => "block",
            "id" => $styles->blockId,
        ], $stylesAll));
    }
    /**
     * @param \Sivujetti\Page\Entities\Page $page
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $site
     * @return array{0: string, 1: string} [$title, $metaMarkup]
     */
    private function __buildSeoMetaMarkup(Page $currentPage, TheWebsite $site): array {
        $metasIn = $currentPage->meta ?? new \stdClass;
        $metasNativeOut = [];
        $metasOgOut = [];
        $ldWebPage = ["@type" => "WebPage"];
        $ldWebSite = ["@type" => "WebSite"];
        // ld+json general
        $webSiteUrl = "{$this->__vars["serverHost"]}{$this->makeUrl("/", withIndexFile: false)}";
        $ldWebSite["url"] = $webSiteUrl;
        $ldWebSite["@id"] = "{$webSiteUrl}#website";
        $ldWebPage["isPartOf"] = ["@id" => $ldWebSite["@id"]];
        // Title
        $siteNameEscaped = $this->e($site->name);
        $escapedTitle = "{$this->e($currentPage->title)} - {$siteNameEscaped}";
        $metasOgOut[] = "<meta property=\"og:title\" content=\"{$escapedTitle}\">";
        $ldWebPage["name"] = $escapedTitle;
        // Description
        if (($description = $metasIn->description ?? null)) {
            $escapedDescr = $this->e($description);
            $metasNativeOut[] = "<meta name=\"description\" content=\"{$escapedDescr}\">";
            $metasOgOut[] = "<meta property=\"og:description\" content=\"{$escapedDescr}\">";
            $ldWebPage["description"] = $escapedDescr;
        }
        // Locale & lang
        $countryCode = strtoupper($site->country ?? $site->lang);
        $metasOgOut[] = "<meta property=\"og:locale\" content=\"{$site->lang}_{$countryCode}\">";
        $ldWebSite["inLanguage"] = $site->lang;
        $ldWebPage["inLanguage"] = $site->lang;
        // Permalink
        $permaFull = "{$this->__vars["serverHost"]}{$this->makeUrl($currentPage->slug)}";
        $metasNativeOut[] = "<link rel=\"canonical\" href=\"{$permaFull}\">";
        $metasOgOut[] = "<meta property=\"og:url\" content=\"{$permaFull}\">";
        $ldWebPage["url"] = $permaFull;
        $ldWebPage["@id"] = "{$permaFull}#webpage";
        $ldWebPage["potentialAction"][] = ["@type" => "ReadAction", "target" => [$permaFull]];
        // Site name + description
        $metasOgOut[] = "<meta property=\"og:site_name\" content=\"{$siteNameEscaped}\">";
        $ldWebSite["name"] = $siteNameEscaped;
        $ldWebSite["description"] = $this->e($site->description);
        //
        $metasOgOut[] = "<script type=\"application/ld+json\">" . self::withoutEscapedBackslashes(json_encode([
            "@context" => "https://schema.org",
            "@graph" => [$ldWebSite, $ldWebPage]
        ])) . "</script>\n";
        //
        return [
            $escapedTitle,
            implode("\n    ", $metasNativeOut) .
            "\n    " .
            implode("\n    ", $metasOgOut)
        ];
    }
    /**
     * @param string $str
     * @return string
     */
    private static function withoutEscapedBackslashes(string $str): string {
        return str_replace("\\/", "/", $str);
    }
}
