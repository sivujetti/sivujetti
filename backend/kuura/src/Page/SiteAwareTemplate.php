<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\{Template, ValidationUtils};

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
     * @param ...$args
     * @return string
     */
    public function partial(string $name, ...$args): string {
        ValidationUtils::checkIfValidaPathOrThrow($name, strict: true);
        $templateFilePath = !str_contains($name, ":")
            ? "{$this->__dir}{$name}.tmpl.php"
            : self::completePath($name) . ".tmpl.php";
        return $this->doRender($templateFilePath,
            array_merge($this->__locals, ["props" => $args ?? []]));
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
