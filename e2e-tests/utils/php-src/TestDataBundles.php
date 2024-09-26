<?php declare(strict_types=1);

namespace Sivujetti\E2eTests;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
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
        $bundleNameToMethod = [
            "minimal" => "makeMinimalDataBundle",
            "page-categories" => "addPageCategoriesToDataBundle",
            "with-listing-block" => "makePageWithListingBlockDataBundle",
            "another-page-type" => "makeExtraPageTypeDataBundle",
        ];
        //
        $out = [];
        foreach (explode("+", $name) as $part) {
            if (!($method = $bundleNameToMethod[$part])) {
                throw new \RuntimeException("Bundle name must be" .
                    " `" . implode("`, `", array_keys($bundleNameToMethod))) . "`";
            }
            $out = $this->$method($out);
        }
        return $out;
    }
    /**
     * @psalm-param TestDataBundle[] $previous
     * @psalm-return TestDataBundle[]
     */
    private function makeMinimalDataBundle(array $previous): array {
        $btu = new BlockTestUtils();
        $block1 = $btu->makeBlockData(Block::TYPE_PAGE_INFO,
            propsData: ["overrides" => "[]"],
            id: "@auto");
        $block2 = $btu->makeBlockData(Block::TYPE_PARAGRAPH,
            propsData: ["text" => "1. e2e test page text"],
            id: "@auto");
        $block3 = $btu->makeBlockData(Block::TYPE_PAGE_INFO,
            propsData: ["overrides" => "[]"],
            id: "@auto");
        $block4 = $btu->makeBlockData(Block::TYPE_PARAGRAPH,
            propsData: ["text" => "2. e2e test page text"],
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
                "id" => "-pppppppppppppppppp1",
                "slug" => "/",
                "path" => "/",
                "categories" => "[]",
                "level" => 1,
                "title" => "Home",
                "meta" => (object) ["description" => "Description here."],
                "layoutId" => "1",
                "blocks" => [$block1, $block2, $block4],
                "status" => Page::STATUS_PUBLISHED,
            ]],
            ["table" => "Pages", "data" => [
                "id" => "-pppppppppppppppppp2",
                "slug" => "/page2",
                "path" => "page2/",
                "categories" => "[]",
                "level" => 1,
                "title" => "Another",
                "meta" => (object) ["description" => "Another pages description."],
                "layoutId" => "1",
                "blocks" => [$block3, $block4],
                "status" => Page::STATUS_PUBLISHED,
            ]]
        ];
    }
    /**
     * @psalm-param TestDataBundle[] $previous
     * @psalm-return TestDataBundle[]
     */
    private function addPageCategoriesToDataBundle(array $previous): array {
        $btu = new BlockTestUtils();
        $block1 = $btu->makeBlockData(Block::TYPE_PAGE_INFO,
            propsData: ["overrides" => "[]"],
            id: "@auto");
        $block2 = $btu->makeBlockData(Block::TYPE_PARAGRAPH,
            propsData: ["text" => "Uncategorized"],
            id: "@auto");
        //
        return array_merge($previous, [
            ["table" => "PagesCategories", "data" => [
                "id" => "-pppppppppppppppppp3",
                "slug" => "/uncategorized",
                "path" => "uncategorized/",
                "level" => 1,
                "title" => "Uncategorized",
                "meta" => (object) [],
                "layoutId" => "1",
                "blocks" => [$block1, $block2],
                "status" => Page::STATUS_PUBLISHED,
            ]]
        ]);
    }
    /**
     * @psalm-param TestDataBundle[] $previous
     * @psalm-return TestDataBundle[]
     */
    private function makePageWithListingBlockDataBundle(array $previous): array {
        $out = $this->makeMinimalDataBundle($previous);
        $out[1]["data"]["blocks"][1] = (new BlockTestUtils())->makeBlockData(Block::TYPE_LISTING,
            renderer: "sivujetti:block-listing-pages-default",
            propsData: ["filterPageType" => "Pages",
                "filterLimit" => 0,
                "filterLimitType" => "all",
                "filterOrder" => "desc",
                "filterAdditional" => new \stdClass,
                "rendererSettings" => null],
            id: "@auto");
        return $out;
    }
    /**
     * @psalm-param TestDataBundle[] $previous
     * @psalm-return TestDataBundle[]
     */
    private function makeExtraPageTypeDataBundle(array $previous): array {
        return array_merge($previous, [
            ["table" => "@create", "data" => [
                "name" => "Articles",
                "slug" => "articles",
                "friendlyName" => "Article",
                "friendlyNamePlural" => "Articles",
                "description" => "",
                "fields" => [
                    "ownFields" => [],
                    "blockBlueprintFields" => [],
                    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "Article"]],
                ],
                "defaultLayoutId" => "1",
                "status" => PageType::STATUS_COMPLETE,
                "isListable" => 1,
            ]],
            ["table" => "Articles", "data" => [
                "id" => "-aaaaaaaaaaaaaaaaaa1",
                "slug" => "/art1",
                "path" => "art1/",
                "level" => 1,
                "title" => "Article 1",
                "meta" => (object) ["description" => "Article 1s description."],
                "layoutId" => "1",
                "blocks" => [],
                "status" => Page::STATUS_PUBLISHED,
            ]],
            ["table" => "Articles", "data" => [
                "id" => "-aaaaaaaaaaaaaaaaaa2",
                "slug" => "/art2",
                "path" => "art2/",
                "level" => 1,
                "title" => "Article 2",
                "meta" => (object) ["description" => "Article 2s description."],
                "layoutId" => "1",
                "blocks" => [],
                "status" => Page::STATUS_PUBLISHED,
            ]]
        ]);
    }
}
