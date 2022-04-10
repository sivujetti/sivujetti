<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Db;
use Pike\Db\FluentDb;
use Sivujetti\Theme\{CssGenCache, ThemeCssFileUpdaterWriter as CssGen};

final class CssGenTestUtils {
    private string $TEST_THEME_NAME = "";
    private string $TEST_THEME_GENERATED_FILE_PATH = "";
    private CssGenCache $cssGenCache;
    public function __construct(Db $db) {
        $this->cssGenCache = new CssGenCache(new FluentDb($db));
    }
    public function prepareStylesFor(string $testThemeName): void {
        $this->TEST_THEME_NAME = $testThemeName;
        $this->TEST_THEME_GENERATED_FILE_PATH = (
            SIVUJETTI_INDEX_PATH . "public/" . $this->TEST_THEME_NAME . "-generated.css"
        );
        if (!is_file($this->TEST_THEME_GENERATED_FILE_PATH))
            file_put_contents($this->TEST_THEME_GENERATED_FILE_PATH, "/* nothing */");
    }
    public function cleanUp(): void {
        if (!$this->TEST_THEME_GENERATED_FILE_PATH)
            return;
        if (is_file($this->TEST_THEME_GENERATED_FILE_PATH))
            unlink($this->TEST_THEME_GENERATED_FILE_PATH);
    }
    public function getActualGeneratedCss(): string {
        $full = file_get_contents($this->TEST_THEME_GENERATED_FILE_PATH);
        [$header, $contents] = explode("UTC */\n\n", $full);
        return $contents;
    }
    public function generateExpectedGeneratedCssContent(?string $expectedBlockTypeBaseStyles = "",
                                                        ?string $expectedBlockStyles = ""): string {
        return (
            "/* > Base styles for all block types start */\n" .
            $expectedBlockTypeBaseStyles .
            "/* < Base styles for all block types end */\n\n" .
            "/* > Styles for all individual blocks start */\n" .
            $expectedBlockStyles .
            "/* < Styles for all individual blocks end */\n"
        );
    }
    public function getCssGenCache(): CssGenCache {
        return $this->cssGenCache;
    }
    public static function generateCachedBlockTypeBaseStyles(array $styles): string {
        return implode("", array_map(fn($style) =>
            "/* >> Base styles for block type \"{$style->blockTypeName}\" start */\n" .
            CssGen::compileBlockTypeBaseCss($style) .
            "/* << Base styles for block type \"{$style->blockTypeName}\" end */\n"
        , $styles));
    }
    public static function generateCachedBlockStyles(array $styles): string {
        return implode("", array_map(fn($style) =>
            "/* >> Styles for individual block \"{$style->blockId}\" start */\n" .
            CssGen::compileBlockCss($style) .
            "/* << Styles for individual block \"{$style->blockId}\" end */\n"
        , $styles));
    }
}