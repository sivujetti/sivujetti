<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{PikeException, Template as PikeTemplate};

/**
 * @psalm-import-type EnvConstants from \Sivujetti\App
 */
class Template extends PikeTemplate {
    private array $__env;
    /**
     * @param string $file
     * @param ?array<string, mixed> $vars = null
     * @psalm-param EnvConstants $env = null (include "config.php")["env"]
     * @param ?array<string, mixed> $initialLocals = null
     */
    public function __construct(string $file,
                                ?array $vars = null,
                                ?array $env = null,
                                ?array $initialLocals = null) {
        parent::__construct(self::getValidPathOrThrow($file, allowSubFolders: true), $vars);
        $this->__locals = $initialLocals ?? [];
        $this->__env = $env ?? ["BASE_URL" => "/", "QUERY_VAR" => ""];
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
        return \htmlspecialchars($str, $flags, "UTF-8", $doubleEncode);
    }
    /**
     * @param string $url
     * @param bool $isWrappedByDoubleQuote = true
     * @return string
     */
    public static function escAttr(string $url, bool $isWrappedByDoubleQuote = true): string {
        return $isWrappedByDoubleQuote ? \str_replace("\"", "&quot;", $url) : \str_replace("'", "&apos;", $url);
    }
    /**
     * @param string $url
     * @param bool $withIndexFile = true
     * @return string
     */
    public function makeUrl(string $url, bool $withIndexFile = true): string {
        $indexFile = !$this->__env["QUERY_VAR"] ? "" : "index.php?{$this->__env["QUERY_VAR"]}=/";
        if (!$withIndexFile || !$indexFile) return $this->__env["BASE_URL"] . self::e(ltrim($url, "/"));
        // "/path?myvar=val" -> "index.php?q=/path&myvar=val"
        $pcs = explode("?", ltrim($url, "/"), 2);
        return $this->__env["BASE_URL"] . $indexFile . self::escAttr($pcs[0]) .
            (count($pcs) === 1 ? "" : ("&amp;" . self::escAttr($pcs[1])));
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
