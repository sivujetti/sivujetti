<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\{PikeException, Template as PikeTemplate};

class Template extends PikeTemplate {
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     */
    public function __construct(string $file, array $vars = null) {
        parent::__construct(self::completePath($file), $vars);
    }
    /**
     * @param string $str
     * @param int $flags = ENT_QUOTES | ENT_HTML5
     * @param bool $doubleEncode = true
     * @return string
     */
    public static function e(string $str,
                             int $flags = ENT_QUOTES | ENT_HTML5,
                             bool $doubleEncode = true): string {
        return htmlspecialchars($str, $flags, "UTF-8", $doubleEncode);
    }
    /**
     * @param string $url
     * @param bool $withIndexFile = true
     * @return string
     */
    public static function makeUrl(string $url, bool $withIndexFile = true): string {
        static $indexFile = !KUURA_QUERY_VAR ? "" : ("index.php?" . KUURA_QUERY_VAR . "=/");
        if (!$withIndexFile || !$indexFile) return KUURA_BASE_URL . self::e(ltrim($url, "/"));
        // "/path?myvar=val" -> "index.php?q=/path&myvar=val"
        $info = parse_url(self::e(ltrim($url, "/")));
        return KUURA_BASE_URL .
            $indexFile .
            ($info["path"] ?? "") .
            (isset($info["query"]) ? "&amp;" . $info["query"] : "") .
            (isset($info["fragment"]) ? "#" . $info["fragment"] : "");
    }
    /**
     * "foo.tmpl.php" -> KUURA_BACKEND_PATH . "assets/templates/foo.tmpl.php"
     * "kuura:foo.tmpl.php" -> KUURA_BACKEND_PATH . "site/templates/foo.tmpl.php"
     * "unknown:var.tmpl.php" -> PikeException
     *
     * @param string $pair
     * @return string
     */
    protected static function completePath(string $pair): string {
        $pcs = explode(":", $pair);
        [$ns, $relFilePath] = count($pcs) > 1
            ? [$pcs[0], implode(":", array_slice($pcs, 1))]
            : ["site", $pcs[0]];
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $whiteList = ["kuura" => KUURA_BACKEND_PATH . "assets/templates/",
                      "site" => KUURA_BACKEND_PATH . "site/templates/"];
        if (!($root = $whiteList[$ns] ?? null))
            throw new PikeException("Invalid template namespace");
        return "{$root}{$relFilePath}";
    }
}
