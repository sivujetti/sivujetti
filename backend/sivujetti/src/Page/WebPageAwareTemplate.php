<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, PikeException};
use Sivujetti\{JsonUtils, SharedAPIContext, Template, ValidationUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Page\Entities\Page;
use Sivujetti\Theme\ThemesController;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class WebPageAwareTemplate extends Template {
    /** @var ?object */
    private ?object $__cssAndJsFiles;
    /** @var string[] */
    private array $__pluginNames;
    /** @var bool */
    private bool $__useEditModeMarkup;
    /** @var string Example "v=rand-str" */
    private string $__assetUrlAppendix;
    /** @var \Closure */
    private \Closure $__applyFilters;
    /** @var array{theme: \Sivujetti\Theme\Entities\Theme, hideFromSearchEngines: bool}|null */
    private ?array $__internal;
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @param ?array<string, mixed> $initialLocals = null
     * @param ?\Sivujetti\SharedAPIContext $apiCtx = null
     * @param ?Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite = null
     * @param ?array<string> $pluginNames = null
     * @param ?bool $useEditModeMarkup = null
     * @param ?string $assetUrlCacheBustStr = ""
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $initialLocals = null,
                                ?SharedAPIContext $apiCtx = null,
                                ?TheWebsite $theWebsite = null,
                                ?array $pluginNames = null,
                                ?bool $useEditModeMarkup = null,
                                ?string $assetUrlCacheBustStr = null) {
        parent::__construct($file, $vars, $initialLocals);
        $this->__cssAndJsFiles = $apiCtx?->userDefinedAssets;
        $this->__internal = $theWebsite
            ? ["theme" => $theWebsite->activeTheme, "hideFromSearchEngines" => $theWebsite->hideFromSearchEngines,]
            : null;
        $this->__useEditModeMarkup = $useEditModeMarkup ?? true;
        $this->__pluginNames = $pluginNames ?? [];
        if ($this->__file === "") $this->__file = $this->completePath($file);
        $this->__assetUrlAppendix = $this->escAttr($assetUrlCacheBustStr ?? "");
        $this->__applyFilters = $apiCtx ? \Closure::fromCallable([$apiCtx, "applyFilters"]) : fn() => null;
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
        $first = $url[0] ?? "";
        if ($url === "" || $first === "#")
            return $url;
        //
        $isLocal = $first === "/";
        if ($isLocal)
            return !str_starts_with($url, "/public/uploads") ? $this->makeUrl($url) : $this->mediaUrl($url);
        //
        $pcs = explode(":", $url);
        return count($pcs) > 1 // http://foo.com, mailto:foo, steam://bar
            ? self::escAttr($url)
            : self::escAttr("//{$url}");
    }
    /**
     * @param string $url
     * @return string Completed url without "?v=cacheBustStr"
     */
    public function mediaUrl(string $url): string {
        return self::makeUrl($url, false);
    }
    /**
     * @param string $url
     * @return string Completed url with "?v=cacheBustStr"
     */
    public function assetUrl(string $url): string {
        return self::makeUrl($url, false) . (!str_contains($url, "?") ? "?" : "&") . $this->__assetUrlAppendix;
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
        [$wrapStart, $childPlaceholder, $wrapEnd] = !$this->__useEditModeMarkup
            ? ["",                        "",                              ""]
            : ["<!-- children-start -->", "<!-- children-placeholder -->", "<!-- children-end -->"];
        return $wrapStart . ($block->children ? (
            $block->children[0]->type !== "__marker"
                ? $this->renderBlocks($block->children)
                : $childPlaceholder
            ) : ""
        ) . $wrapEnd;
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $blocks
     * @return string
     */
    public function renderBlocks(array $blocks): string {
        $out = "";
        $emptyString = !$this->__useEditModeMarkup ? "" : null;
        foreach ($blocks as $block)
            $out .= $block->type !== Block::TYPE_GLOBAL_BLOCK_REF
                ? $this->partial($block->renderer, $block)
                : (
                    ($emptyString ?? "<!-- block-start {$block->id}:{$block->type} -->") .
                        $this->renderBlocks($block->__globalBlockTree->blocks) .
                    ($emptyString ?? "<!-- block-end {$block->id} -->")
                );
        return $out;
    }
    /**
     * Note: mutates $block->__blobalBlockTree->blocks*->*
     *
     * @deprecated
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
        foreach (JsonUtils::parse($overrides) as $blockId => $perBlockPropOverrides) {
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
     * @see \Sivujetti\Block\BlockTree::findBlockAndTree()
     */
    public function findBlockAndTree(array $branch, callable $predicate): array {
        return BlockTree::findBlockAndTree($branch, $predicate);
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
        return $this->__applyFilters->__invoke("sivujetti:webPageGeneratedHeadHtml", "<html lang=\"{$site->lang}\">\n" .
            "<head>\n" .
            "    <meta charset=\"utf-8\">\n" .
            "    <title>{$title}</title>\n" .
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" .
            "    <meta name=\"generator\" content=\"Sivujetti\">\n" .
            ($this->__internal["hideFromSearchEngines"]
                ? "    <meta name=\"robots\" content=\"noindex, nofollow, nosnippet, noarchive\">\n"
                : "") .
            "    {$metaMarkup}" .
            "    {$this->cssFiles($site)}\n" .
            "</head>\n");
    }
    /**
     * @param ?\Sivujetti\TheWebsite\Entities\TheWebsite $site = null
     * @return string
     */
    public function cssFiles(?TheWebsite $site = null): string {
        $fileDefToTag = function ($f) {
            $attrsMap = $f->attrs;
            if (!array_key_exists("rel", $attrsMap)) $attrsMap["rel"] = "stylesheet";
            return "<link href=\"{$this->assetUrl("public/{$this->e($f->url)}")}\"" .
                $this->attrMapToStr($attrsMap) . ">";
        };

        $theme = $this->__internal["theme"];
        $common = "<style>@layer theme, body-unit, base-units, var-units, units" . ($theme->globalStyles
            ? "; :root {" .
                implode("\n", array_map(fn($style) =>
                    // Note: these are pre-validated
                    "  --{$style->name}: {$this->cssValueToString($style->value)};"
                , $theme->globalStyles)) .
            "}"
            : ""
        ) . "</style>\n";
        $externals = array_map($fileDefToTag, $this->__cssAndJsFiles->css);
        $site = $site ?? $this->__locals["site"];

        return $common . (!$this->__useEditModeMarkup ? (
            // Externals including theme-generated.css
            implode("\n", [...$externals, $fileDefToTag(
                (object) ["url" => "{$theme->name}-generated.css?t={$theme->stylesLastUpdatedAt}",
                          "attrs" => []]
            )]) .
            // theWebsite->headHtml
            ($site ? "\n{$site->headHtml}" : null)
        ) : (
            // Externals without theme-generated.css
            implode("\n", $externals) .
            // Injectables
            "\n<!-- Note to devs: these inline styles appear here only when you're logged in -->\n" .
            // Scoped styles: Inject each style bundle via javascript instead of echoing them directly
            // (to allow things such as `content: "</style>"` or `/* </style> */`)
            "<script>document.head.appendChild(" . self::escInlineJs(JsonUtils::stringify(
                array_merge(array_map(fn($itm) => (object) [
                    "css" => ThemesController::combineAndWrapCss($itm->units, $itm->blockTypeName),
                    "blockTypeName" => $itm->blockTypeName,
                ], $theme->styles), $this->__applyFilters->__invoke("sivujetti:editAppAdditionalStyleUnits", []))
            ) . ".reduce((out, {css, blockTypeName}) => {\n" .
            "  const bundle = document.createElement('style');\n" .
            "  bundle.innerHTML = css;\n" .
            "  bundle.setAttribute('data-style-units-for', blockTypeName);\n" .
            "  out.appendChild(bundle);\n" .
            "  return out;\n") .
            "}, document.createDocumentFragment()))</script>\n" .
            //
            "<style>" . self::getDefaultEditModeInlineCss() . "</style>\n"
        ));
    }
    /**
     * @param ?\Sivujetti\TheWebsite\Entities\TheWebsite $site = null
     * @return string
     */
    public function jsFiles(?TheWebsite $site = null): string {
        return (
            // Scripts defined by the dev
            ($this->__cssAndJsFiles ? implode("\n", array_map(function ($f) {
                $attrsMap = $f->attrs;
                //
                $pre = !str_starts_with($f->url, "sivujetti/sivujetti-commons-for-web-pages.js")
                    ? ""
                    : "<script>window.sivujettiBaseUrl='{$this->makeUrl("/", true)}';\n" .
                    "        window.sivujettiAssetBaseUrl='{$this->makeUrl("/", false)}';</script>";
                //
                $url = str_contains($f->url, "pristine") || str_starts_with($_SERVER["REQUEST_URI"] ?? "/sivujetti/", "/sivujetti/") ? $this->assetUrl("public/{$this->e($f->url)}") : ("/sivujetti/public/{$this->e($f->url)}?".$this->__assetUrlAppendix);
                // $url = $this->assetUrl("public/{$this->e($f->url)}");
                //
                return "{$pre}<script src=\"{$url}\"{$this->attrMapToStr($attrsMap)}></script>";
            }, $this->__cssAndJsFiles->js)) : "") .
            // theWebsite->footHtml
            (($this->__useEditModeMarkup || !($site = $site ?? $this->__locals["site"]))
                ? ""
                : "\n{$site->footHtml}\n")
        );
    }
    /**
     * https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements
     * https://stackoverflow.com/a/20942828
     *
     * @param string $json
     * @return string
     */
    public static function escInlineJs(string $json): string {
        return str_replace(
            ["<!--", "<script", "</script"],
            ['<"+"!--', '<"+"script', '</"+"script'],
            $json
        );
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
        // Type
        $metasOgOut[] = "<meta property=\"og:type\" content=\"website\">";
        // Description
        if (($description = $metasIn->description ?? null)) {
            $escapedDescr = $this->e($description);
            $metasNativeOut[] = "<meta name=\"description\" content=\"{$escapedDescr}\">";
            $metasOgOut[] = "<meta property=\"og:description\" content=\"{$escapedDescr}\">";
            $ldWebPage["description"] = $escapedDescr;
        }
        // Locale & lang
        $countryCode = $site->country; // guaranteed to contain only A-Z{2}
        $metasOgOut[] = "<meta property=\"og:locale\" content=\"{$site->lang}_{$countryCode}\">";
        $ldWebSite["inLanguage"] = $site->lang; // guaranteed to contain only a-z{2}
        $ldWebPage["inLanguage"] = $ldWebSite["inLanguage"];
        // Permalink
        $permaFull = "{$this->__vars["serverHost"]}{$this->makeUrl($currentPage->slug)}";
        $metasNativeOut[] = "<link rel=\"canonical\" href=\"{$permaFull}\">";
        $metasOgOut[] = "<meta property=\"og:url\" content=\"{$permaFull}\">";
        $ldWebPage["url"] = $permaFull;
        $ldWebPage["@id"] = "{$permaFull}#webpage";
        $ldWebPage["potentialAction"][] = ["@type" => "ReadAction", "target" => [$permaFull]];
        // Published at + Last modified at
        $lastUpdatedAtW3C = date("Y-m-d\TH:i:sP", $currentPage->lastUpdatedAt);
        $metasNativeOut[] = "<meta property=\"article:modified_time\" content=\"{$lastUpdatedAtW3C}\">";
        $ldWebPage["datePublished"] = date("Y-m-d\TH:i:sP", $currentPage->createdAt);
        $ldWebPage["dateModified"] = $lastUpdatedAtW3C;
        // Site name + description
        $metasOgOut[] = "<meta property=\"og:site_name\" content=\"{$siteNameEscaped}\">";
        $ldWebSite["name"] = $siteNameEscaped;
        $ldWebSite["description"] = $this->e($site->description);
        // Social image
        $ldImage = null;
        if (($img = $metasIn->socialImage ?? null)) {
            $host = $this->__vars["serverHost"];
            $full = "{$host}{$this->mediaUrl("/public/uploads/{$img->src}")}";
            $metasOgOut[] = "<meta property=\"og:image\" content=\"{$full}\">";
            $metasOgOut[] = "<meta property=\"og:image:width\" content=\"{$img->width}\">"; // always integer
            $metasOgOut[] = "<meta property=\"og:image:height\" content=\"{$img->height}\">";
            $metasOgOut[] = "<meta property=\"og:image:type\" content=\"{$this->escAttr($img->mime)}\">";
            $metasOgOut[] = "<meta name=\"twitter:card\" content=\"summary_large_image\">";
            $ldImage = ["@type" => "ImageObject"];
            $ldImage["@id"] = "{$webSiteUrl}#primaryimage";
            $ldImage["inLanguage"] = $ldWebSite["inLanguage"];
            $ldImage["url"] = $full;
            $ldImage["contentUrl"] = $full;
            $ldImage["width"] = $img->width;
            $ldImage["height"] = $img->height;
            $ldWebPage["primaryImageOfPage"] = ["@id" => $ldImage["@id"]];
        }
        //
        $metasOgOut[] = "<script type=\"application/ld+json\">" . JsonUtils::stringify([
            "@context" => "https://schema.org",
            "@graph" => [...[$ldWebSite, $ldWebPage], ...($ldImage ? [$ldImage] : [])]
        ], JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . "</script>\n";
        //
        return [
            $escapedTitle,
            implode("\n    ", $metasNativeOut) .
            "\n    " .
            implode("\n    ", $metasOgOut)
        ];
    }
    private static function getDefaultEditModeInlineCss(): string {
        return implode("\n", [
            "@keyframes sjet-dotty {",
            "  0%   { content: ''; }",
            "  25%  { content: '.'; }",
            "  50%  { content: '..'; }",
            "  75%  { content: '...'; }",
            "  100% { content: ''; }",
            "}",
            ".sjet-dots-animation {",
            "  font-size: 1.2rem;",
            "  line-height: 1.2rem;",
            "}",
            ".sjet-dots-animation:after {",
            "  display: inline-block;",
            "  animation: sjet-dotty steps(1, end) 1s infinite;",
            "  content: '';",
            "  letter-spacing: 2px;",
            "}",
        ]);
    }
}
