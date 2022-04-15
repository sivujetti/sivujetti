<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Db;
use Sivujetti\Block\BlockValidator;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, GlobalBlockReferenceBlockType, HeadingBlockType,
                         ParagraphBlockType, SectionBlockType};
use Sivujetti\Page\Entities\Page;
use Sivujetti\Page\{PagesRepository};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\SharedAPIContext;

final class PageTestUtils {
    public const TEST_LAYOUT_FILENAME = "layout.default.tmpl.php";
    /** @var \Sivujetti\Tests\Utils\LayoutTestUtils */
    public LayoutTestUtils $layoutTestUtils;
    /** @var \Sivujetti\Page\PagesRepository */
    private PagesRepository $pagesRepo;
    /** @var \Closure Overwrites $this->pagesRepo */
    private \Closure $createPageRepo;
    /**
     * @param \Pike\Db $db
     * @param ?\Sivujetti\SharedAPIContext $testApiCtx = null
     */
    public function __construct(Db $db, ?SharedAPIContext $testApiCtx = null) {
        $fakeTheWebsite = new TheWebsite;
        $fakeTheWebsite->pageTypes = new \ArrayObject;
        $pagePageType = $this->makeDefaultPageType();
        $fakeTheWebsite->pageTypes[] = $pagePageType;
        $testApiCtx = self::createTestApiCtx($testApiCtx);
        $this->layoutTestUtils = new LayoutTestUtils($db);
        $this->createPageRepo = function (\Closure $doBefore) use ($db, $fakeTheWebsite, $testApiCtx) {
            $doBefore($db, $fakeTheWebsite, $testApiCtx);
            $this->pagesRepo = new PagesRepository($db, $fakeTheWebsite,
                $testApiCtx->blockTypes,
                new PageTypeValidator(new BlockValidator($testApiCtx))
            );
        };
        $this->createPageRepo->__invoke(function () {});
    }
    /**
     * @param object $data \Sivujetti\Page\Entities\Page|object
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?string $lastInsertId or null
     */
    public function insertPage(object $data, ?PageType $pageType = null): ?string {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        if ($data->layoutId)
            $this->layoutTestUtils->insertLayout((object) ["id" => $data->layoutId]);
        return $this->pagesRepo->insert($pageType, $data, doValidateBlocks: false)
            ? $this->pagesRepo->lastInsertId
            : null;
    }
    /**
     * @param string $slug
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    public function getPageBySlug(string $slug, ?PageType $pageType = null): ?Page {
        if (($out = $this->t($pageType, ["slug" => $slug]))) {
            unset($out->blocks);
            unset($out->layout);
            unset($out->layoutFriendlyName);
            unset($out->layoutRelFilePath);
            unset($out->layoutStructureJson);
            unset($out->blockStyles);
            unset($out->pageBlocksStylesJson);
            unset($out->metaJson);
        }
        return $out;
    }
    /**
     * @param string $id
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    public function getPageById(string $id, ?PageType $pageType = null): ?Page {
        return $this->t($pageType, ["p.`id`" => $id]);
    }
    /**
     * @return \Sivujetti\PageType\Entities\PageType
     */
    public function makeDefaultPageType(): PageType {
        $pageType = new PageType;
        $pageType->name = PageType::PAGE;
        $pageType->ownFields = [(object) [
            "name" => "categories",
            "friendlyName" => "",
            "dataType" => (object) ["type" => "many-to-many"],
            "defaultValue" => "",
            "isNullable" => false,
        ]];
        return $pageType;
    }
    /**
     * @param ?array<int, \Sivujetti\Block\Entities\Block> $blocks = null
     * @return object
     */
    public function makeTestPageData(?array $blocks = null): object {
        return (object) [
            "slug" => "/hello",
            "path" => "/hello",
            "level" => 1,
            "title" => "<Hello>",
            "meta" => (object) ["description" => "Greetings >"],
            "layoutId" => "1",
            "blocks" => $blocks ?? self::makeDefaultBlockTree(),
            "categories" => "[]",
            "status" => Page::STATUS_PUBLISHED,
        ];
    }
    /**
     * @param object $testPageData
     * @param string $themeId
     * @return object
     */
    public function makePageBlockStylesData(object $testPageData, string $themeId): object {
        $someBlock = $testPageData->blocks[0];
        return (object) [
            "styles" => json_encode([(object) ["blockId" => $someBlock->id, "styles" => "{ color: red; }"]]),
            "pageId" => "@later",
            "pageTypeName" => PageType::PAGE,
            "themeId" => $themeId,
        ];
    }
    /**
     * @return \Sivujetti\PageType\Entities\PageType
     */
    public function registerTestCustomPageType(): PageType {
        $pageType = new PageType;
        $pageType->name = "MyProducts";
        $pageType->ownFields = [
            (object) ["name" => "ownField1", "dataType" => (object) ["type" => "text"],
                      "friendlyName" => "Some prop", "defaultValue" => "foo"],
            (object) ["name" => "ownField2", "dataType" => (object) ["type" => "uint"],
                      "friendlyName" => "Some prop2", "defaultValue" => 123],
        ];
        //
        $this->createPageRepo->__invoke(function ($db, $fakeTheWebsite, $_testApiCtx) use ($pageType) {
            $fakeTheWebsite->pageTypes[] = $pageType;
            $id = 100 + array_search($pageType, $fakeTheWebsite->pageTypes->getArrayCopy());
            //
            $db->exec("CREATE TABLE `\${p}MyProducts` (
                `id` INTEGER PRIMARY KEY AUTOINCREMENT,
                `slug` TEXT NOT NULL,
                `path` TEXT,
                `level` INTEGER NOT NULL DEFAULT 1,
                `title` TEXT NOT NULL,
                `meta` JSON,
                `layoutId` TEXT NOT NULL,
                `blocks` JSON,
                `status` INTEGER NOT NULL DEFAULT 0,
                `ownField1` TEXT,
                `ownField2` INTEGER
            )");
            [$qList, $vals, $cols] = $db->makeInsertQParts((object) [
                "id" => $id,
                "name" => "MyProducts",
                "slug" => "my-products",
                "friendlyName" => "Product",
                "friendlyNamePlural" => "Products",
                "description" => "",
                "fields" => json_encode([
                    "ownFields" => $pageType->ownFields,
                    "blockFields" => [(object) ["type" => "Paragraph", "title" => "", "defaultRenderer" => "sivujetti:block-auto",
                                                "initialData" => (object) ["text" => "Paragraph text", "cssClass" => ""],
                                                "children" => []]],
                    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "Product name"]],
                ]),
                "defaultLayoutId" => "1",
                "status" => PageType::STATUS_COMPLETE,
                "isListable" => 1,
            ]);
            $db->exec("INSERT INTO `pageTypes` ({$cols}) VALUES ({$qList})", $vals);
        });
        return $pageType;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     */
    public function dropCustomPageType(PageType $pageType): void {
        $this->createPageRepo->__invoke(function ($db, $fakeTheWebsite, $_testApiCtx) use ($pageType) {
            $idx = array_search($pageType, $fakeTheWebsite->pageTypes->getArrayCopy());
            $fakeTheWebsite->pageTypes->offsetUnset($idx);
            $id = 100 + $idx;
            //
            $db->exec("DROP TABLE IF EXISTS `\${p}{$pageType->name}`");
            $db->exec("DELETE FROM `pageTypes` WHERE `id` = ?", [$id]);
        });
    }
    /**
     * @param ?SharedAPIContext $initial = null
     * @return \Sivujetti\SharedAPIContext
     */
    public static function createTestApiCtx(?SharedAPIContext $initial = null): SharedAPIContext {
        $out = $initial ?? new SharedAPIContext;
        if (!isset($out->blockTypes)) {
            $blockTypes = new BlockTypes;
            $blockTypes->{Block::TYPE_BUTTON} = new ButtonBlockType;
            $blockTypes->{Block::TYPE_GLOBAL_BLOCK_REF} = new GlobalBlockReferenceBlockType;
            $blockTypes->{Block::TYPE_HEADING} = new HeadingBlockType;
            $blockTypes->{Block::TYPE_PARAGRAPH} = new ParagraphBlockType;
            $blockTypes->{Block::TYPE_SECTION} = new SectionBlockType;
            $out->blockTypes = $blockTypes;
        }
        return $out;
    }
    /**
     * @param object $input
     * @return object {description: string}
     */
    public static function createCleanMetaFromInput(object $input): object {
        return (object) ["description" => $input->description];
    }
    /**
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private static function makeDefaultBlockTree(): array {
        $btu = new BlockTestUtils();
        return [$btu->makeBlockData(Block::TYPE_SECTION, "Main", "sivujetti:block-generic-wrapper", children: [
            $btu->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Hello", "level" => 2, "cssClass" => ""]),
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Text", "cssClass" => ""]),
        ], propsData: ["bgImage" => "", "cssClass" => ""])];
    }
    /**
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    private function t(?PageType $pageType = null, ...$filters): ?Page {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        return $this->pagesRepo->getSingle($pageType, "1", ...$filters);
    }
}
