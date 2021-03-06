<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\{PikeException};
use Sivujetti\{FileSystem};

final class ThemeCssFileUpdaterWriter {
    /** @var \Sivujetti\FileSystem */
    private FileSystem $fs;
    /** @var \Sivujetti\Theme\CssGenCache */
    private CssGenCache $cache;
    /**
     * @param \Sivujetti\FileSystem $fs
     * @param \Sivujetti\Theme\CssGenCache $cache
     */
    public function __construct(FileSystem $fs, CssGenCache $cache) {
        $this->fs = $fs;
        $this->cache = $cache;
    }
    /**
     * Overwrites $blockTypeName's base styles from SIVUJETTI_INDEX_PATH . "public/{$themeName}-generated.css".
     * Note: mutates $currentStylesCached.
     *
     * @param string $blockTypeName
     * @param string $updatedStyles
     * @param object $currentStylesCached
     * @param string $themeName
     */
    public function overwriteBlockTypeBaseStylesToDisk(string $blockTypeName,
                                                       string $updatedStyles,
                                                       object $currentStylesCached,
                                                       string $themeName): void {
        // 1. Mutate $currentStylesCached
        $currentStylesCached->generatedBlockTypeBaseCss = self::addOrReplaceLines(
            from: $currentStylesCached->generatedBlockTypeBaseCss,
            withLines: self::compileCss($updatedStyles, "[data-block-type=\"{$blockTypeName}\"]"),
            startLine: "/* >> Base styles for block type \"{$blockTypeName}\" start */\n",
            endLine: "/* << Base styles for block type \"{$blockTypeName}\" end */\n"
        );
        // 2. Update cache
        $numRows = $this->cache->updateBlockTypeBaseCss($currentStylesCached->generatedBlockTypeBaseCss,
                                                        $themeName);
        if ($numRows !== 1) throw new PikeException("Failed to update cache");
        // 3. Update the css file, @allow \Pike\PikeException
        $this->overwriteAllToDisk($currentStylesCached, $themeName);
    }
    /**
     * Overwrites $blockId's styles from SIVUJETTI_INDEX_PATH . "public/{$themeName}-generated.css".
     * Note: mutates $currentStylesCached.
     *
     * @param object[] $updatedStyles
     * @param object $currentStylesCached
     * @param string $themeName
     */
    public function overwriteBlockStylesToDisk(array $updatedStyles,
                                               object $currentStylesCached,
                                               string $themeName): void {
        // 1. Mutate $currentStylesCached
        foreach ($updatedStyles as $style) {
            $blockId = $style->blockId;
            $currentStylesCached->generatedBlockCss = self::addOrReplaceLines(
                from: $currentStylesCached->generatedBlockCss,
                withLines: self::compileBlockCss($style),
                startLine: "/* >> Styles for individual block \"{$blockId}\" start */\n",
                endLine: "/* << Styles for individual block \"{$blockId}\" end */\n"
            );
        }
        // 2. Update cache
        $numRows = $this->cache->updateBlocksCss($currentStylesCached->generatedBlockCss,
                                                 $themeName);
        if ($numRows !== 1) throw new PikeException("Failed to update cache");
        // 3. Update the css file, @allow \Pike\PikeException
        $this->overwriteAllToDisk($currentStylesCached, $themeName);
    }
    /**
     * @param object $styles {styles: string, blockTypeName: string}
     * @return string
     */
    public static function compileBlockTypeBaseCss(object $styles): string {
        return self::compileCss($styles->styles, "[data-block-type=\"{$styles->blockTypeName}\"]");
    }
    /**
     * @param object $styles {styles: string, blockId: string}
     * @return string
     */
    public static function compileBlockCss(object $styles): string {
        return self::compileCss($styles->styles, "[data-block=\"{$styles->blockId}\"]");
    }
    /**
     * Replaces every line between $startLine and $endLine with $startLine + $withLines
     * from $from.
     *
     * @param string $from The haystack
     * @param string $withLines Lines to add after $startLine
     * @param string $startLine Add $withLines after this line or offset
     * @param string $endLine
     * @param ?int $startLineStartPos = null
     * @return string
     * @throws \Pike\PikeException If $from doesn't contain $startLine or $endLine
     */
    public static function replaceLinesBetween(string $from,
                                                string $withLines,
                                                string $startLine,
                                                string $endLine,
                                                ?int $startLineStartPos = null): string {
        if ($startLineStartPos === null && ($startLineStartPos = strpos($from, $startLine)) === false)
            throw new PikeException("\$from doesn't contain line `{$startLine}`",
                                    PikeException::ERROR_EXCEPTION);
        $beginningOfLineAfterStartLinePos = $startLineStartPos + strlen($startLine);
        $endLineStartPos = strpos($from, $endLine, $beginningOfLineAfterStartLinePos);
        if ($endLineStartPos === false)
            throw new PikeException("\$from doesn't contain line `{$endLine}`",
                                    PikeException::ERROR_EXCEPTION);
        return (
            substr($from, 0, $beginningOfLineAfterStartLinePos) .
            $withLines .
            substr($from, $endLineStartPos)
        );
    }
    /**
     * @param object $stylesAll
     * @param string $themeName
     */
    private function overwriteAllToDisk(object $stylesAll, string $themeName): void {
        // @allow \Pike\PikeException
        $this->fs->write(SIVUJETTI_INDEX_PATH . "public/{$themeName}-generated.css", (
            "/* Generated by Sivujetti at " . gmdate("D, M d Y H:i:s e", time()) . " */\n\n".
            "/* > Base styles for all block types start */\n" .
            $stylesAll->generatedBlockTypeBaseCss .
            "/* < Base styles for all block types end */\n\n" .
            "/* > Styles for all individual blocks start */\n" .
            $stylesAll->generatedBlockCss .
            "/* < Styles for all individual blocks end */\n"
        ));
    }
    /**
     * @param string $input
     * @param string $selector
     * @return string
     */
    private static function compileCss(string $input, string $selector): string {
        $withLfEndings = $input ? str_replace("\r", "", $input) : ":self { }\n";
        $withNewline = $withLfEndings[-1] === "\n" ? $withLfEndings : "{$withLfEndings}\n";
        return str_replace(":self", $selector, $withNewline);
    }
    /**
     * @param string $from The haystack
     * @param string $withLines
     * @param string $startLine
     * @param string $endLine
     * @return string
     */
    private static function addOrReplaceLines(string $from,
                                              string $withLines,
                                              string $startLine,
                                              string $endLine): string {
        $startLineStartPos = strpos($from, $startLine);
        if ($startLineStartPos !== false) {
            return self::replaceLinesBetween($from, $withLines, $startLine, $endLine, $startLineStartPos);
        }
        return "{$from}{$startLine}{$withLines}{$endLine}";
    }
}
