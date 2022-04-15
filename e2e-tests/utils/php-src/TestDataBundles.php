<?php declare(strict_types=1);

namespace Sivujetti\E2eTests;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\BlockTestUtils;

/**
 * @psalm-type TestDataBundle = array{table: string, data: array<string, mixed>}
 */
final class TestDataBundles {
    /**
     * @param string $name 'minimal'
     * @return TestDataBundle[]
     * @throws \RuntimeException
     */
    public function createBundle(string $name): array {
        return match ($name) {
            "minimal" => $this->makeMinimalDataBundle(),
            default => throw new \RuntimeException("Bundle name supports only value \"minimal\"")
        };
    }
    /**
     * @return TestDataBundle[]
     */
    private function makeMinimalDataBundle(): array {
        $btu = new BlockTestUtils();
        $block1 = $btu->makeBlockData(Block::TYPE_PAGE_INFO,
            propsData: ["overrides" => "[]"],
            id: "@auto");
        $block2 = $btu->makeBlockData(Block::TYPE_PARAGRAPH,
            propsData: ["text" => "Hello e2e test", "cssClass" => ""],
            id: "@auto");
        //
        return [
            ["table" => "Layouts", "data" => [
                "id" => "1",
                "friendlyName" => "Default layout",
                "relFilePath" => "layout.default.tmpl.php",
                "structure" => [(object) ["type" => "pageContents"]],
            ]],
            ["table" => "Pages", "data" => [
                "id" => "1",
                "slug" => "/",
                "path" => "/",
                "level" => 1,
                "title" => "Home",
                "meta" => (object) ["description" => "Description here."],
                "layoutId" => "1",
                "blocks" => [$block1, $block2],
                "status" => 0
            ]]
        ];
    }
}
