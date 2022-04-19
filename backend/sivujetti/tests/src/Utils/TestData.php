<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

class TestData {
    /**
     * @return array<int, object> [{styles: string, blockTypeName: string}]
     */
    public static function getBlockTypeBaseStyles(): array {
        return [(object) [
            "styles" => "[[scope]] { padding: 4rem 2rem; }",
            "blockTypeName" => "Section",
        ], (object) [
            "styles" => "[[scope]] { font-size: 1rem; }",
            "blockTypeName" => "Paragraph",
        ]];
    }
}
