<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{PikeException, Template as PikeTemplate};

class Template extends PikeTemplate {
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @param ?array<string, mixed> $initialLocals = null
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $initialLocals = null) {
        parent::__construct(self::getValidPathOrThrow($file, allowSubFolders: true), $vars);
        $this->__locals = $initialLocals ?? [];
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
        static $indexFile = !SIVUJETTI_QUERY_VAR ? "" : ("index.php?" . SIVUJETTI_QUERY_VAR . "=/");
        if (!$withIndexFile || !$indexFile) return SIVUJETTI_BASE_URL . self::e(ltrim($url, "/"));
        // "/path?myvar=val" -> "index.php?q=/path&myvar=val"
        $info = parse_url(self::e(ltrim($url, "/")));
        return SIVUJETTI_BASE_URL .
            $indexFile .
            ($info["path"] ?? "") .
            (isset($info["query"]) ? "&amp;" . $info["query"] : "") .
            (isset($info["fragment"]) ? "#" . $info["fragment"] : "");
    }
    /**
     * "foo.tmpl.php" -> SIVUJETTI_SITE_PATH . "templates/foo.tmpl.php"
     * "site:foo.tmpl.php" -> same as above
     * "sivujetti:block-auto.tmpl.php" -> SIVUJETTI_BACKEND_PATH . "assets/templates/block-auto.tmpl.php"
     * "unknown:something.tmpl.php" -> PikeException
     *
     * @param string $fileId
     * @param bool $allowSubFolders = false
     * @return string
     */
    public static function getValidPathOrThrow(string $fileId,
                                               bool $allowSubFolders = false): string {
        [$ns, $relFilePath] = self::getFileIdParts($fileId);
        if (str_starts_with($ns, "plugins/"))
            return "";
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath, !$allowSubFolders);
        $whiteList = ["sivujetti" => SIVUJETTI_BACKEND_PATH . "assets/templates/",
                      "site" => SIVUJETTI_SITE_PATH . "templates/"];
        if (!($root = $whiteList[$ns] ?? null))
            throw new PikeException("Renderer namespace must be " .
                implode(" or ", array_keys($whiteList)) . " (yours was `{$ns}`.)",
                PikeException::BAD_INPUT);
        return "{$root}{$relFilePath}";
    }
    /**
     * @param string $fileId
     * @return array{0: string, 1: string}
     */
    protected static function getFileIdParts(string $fileId): array {
        $pcs = explode(":", $fileId, 2);
        return count($pcs) > 1 ? $pcs : ["site", $pcs[0]];
    }
}
