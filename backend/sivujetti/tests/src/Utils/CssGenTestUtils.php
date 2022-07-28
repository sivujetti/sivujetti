<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

final class CssGenTestUtils {
    private string $TEST_THEME_NAME = "";
    private string $TEST_THEME_GENERATED_FILE_PATH = "";
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
        $lines = explode("\n", $full); // [<header>, <emptyLine>, <scopedStylesStartMarker>, <scopedStyle>*, <scopedStylesEndMarker>]
        return implode("\n", array_slice($lines, 3, count($lines) - 4 - 1)) . "\n";
    }
    public static function generateScopedStyles(array $styles): string {
        return implode("", array_map(function ($style) {
            $units = is_array($style->units) ? $style->units : json_decode($style->units);
            return "/* -- .j-{$style->blockTypeName} classes start -- */\n" .
                (count($units) > 0 ? implode("\n", array_map(fn($b) =>
                    $b->generatedCss,
                $units)) : "/* - */") . "\n" .
            "/* -- .j-{$style->blockTypeName} classes end -- */\n";
        }, $styles));
    }
}
