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
     * 'foo.tmpl.php' -> KUURA_BACKEND_PATH . 'assets/templates/foo.tmpl.php'
     * 'kuura:foo.tmpl.php' -> KUURA_BACKEND_PATH . 'site/templates/foo.tmpl.php'
     * 'unknown:var.tmpl.php' -> PikeException
     *
     * @access private
     */
    private static function completePath(string $pair): string {
        $pcs = explode(':', $pair);
        [$ns, $relFilePath] = count($pcs) > 1
            ? [$pcs[0], implode(':', array_slice($pcs, 1))]
            : ['site', $pcs[0]];
        ValidationUtils::checkIfValidaPathOrThrow($relFilePath);
        $whiteList = ['kuura' => KUURA_BACKEND_PATH . 'assets/templates/',
                      'site' => KUURA_BACKEND_PATH . 'site/templates/'];
        if (!($root = $whiteList[$ns] ?? null))
            throw new PikeException('Invalid template namespace');
        return "{$root}{$relFilePath}";
    }
}
