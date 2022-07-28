<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

class TestData {
    /**
     * @return array<int, object> [{units: string, themeId: string, blockTypeName: string}]
     */
    public static function getThemeStyles(): array {
        return [(object) [
            "units" => json_encode([["title" => "Default", "id" => "default",
                "scss" => "margin:0 auto;&> [data-block-root]{padding: 4rem 2rem}",
                "generatedCss" => ".j-Section-default{margin:0 auto;}.j-Section-default>[data-block-root]{padding:4rem 2rem;}"]]),
            "themeId" => "1",
            "blockTypeName" => "Section",
        ], (object) [
            "units" => json_encode([["title" => "Default", "id" => "Default",
                "scss" => "font-size: 1rem",
                "generatedCss" => ".j-Paragraph-default{font-size:1rem;}"]]),
            "themeId" => "1",
            "blockTypeName" => "Paragraph",
        ]];
    }
}
