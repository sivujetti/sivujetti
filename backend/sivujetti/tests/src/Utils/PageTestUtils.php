<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Db;
use Sivujetti\Block\BlockValidator;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{GlobalBlockReferenceBlockType, HeadingBlockType,
                         ParagraphBlockType, SectionBlockType};
use Sivujetti\Page\Entities\Page;
use Sivujetti\Page\{PagesRepository};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\SharedAPIContext;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\BlockType\Entities\BlockTypes;

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
     * @param ?\Sivujetti\SharedAPIContext $testAppStorage = null
     */
    public function __construct(Db $db, ?SharedAPIContext $testAppStorage = null) {
        $fakeTheWebsite = new TheWebsite;
        $fakeTheWebsite->pageTypes = new \ArrayObject;
        $pagePageType = $this->makeDefaultPageType();
        $fakeTheWebsite->pageTypes[] = $pagePageType;
        $testAppStorage = self::createTestAPIStorage($testAppStorage);
        $this->layoutTestUtils = new LayoutTestUtils($db);
        $this->createPageRepo = function (\Closure $doBefore) use ($db, $fakeTheWebsite, $testAppStorage) {
            $doBefore($db, $fakeTheWebsite, $testAppStorage);
            $this->pagesRepo = new PagesRepository($db, $fakeTheWebsite,
                $testAppStorage->getDataHandle()->blockTypes,
                new PageTypeValidator(new BlockValidator($testAppStorage))
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
        $pageType->ownFields = [(object) ["name" => "categories", "dataType" => "many-to-many"]];
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
            "layoutId" => "1",
            "blocks" => $blocks ?? self::makeDefaultBlockTree(),
            "categories" => "[]",
            "status" => Page::STATUS_PUBLISHED,
        ];
    }
    /**
     * @return \Sivujetti\PageType\Entities\PageType
     */
    public function registerTestCustomPageType(): PageType {
        $pageType = new PageType;
        $pageType->name = "MyProducts";
        $pageType->ownFields = [
            (object) ["name" => "ownField1", "dataType" => "text", "friendlyName" => "Some prop", "defaultValue" => "foo"],
            (object) ["name" => "ownField2", "dataType" => "uint", "friendlyName" => "Some prop2", "defaultValue" => 123],
        ];
        //
        $this->createPageRepo->__invoke(function ($db, $fakeTheWebsite, $_testAppStorage) use ($pageType) {
            $fakeTheWebsite->pageTypes[] = $pageType;
            $id = 100 + array_search($pageType, $fakeTheWebsite->pageTypes->getArrayCopy());
            //
            $db->exec("CREATE TABLE `\${p}MyProducts` (
                `id` INTEGER PRIMARY KEY AUTOINCREMENT,
                `slug` TEXT NOT NULL,
                `path` TEXT,
                `level` INTEGER NOT NULL DEFAULT 1,
                `title` TEXT NOT NULL,
                `layoutId` TEXT NOT NULL,
                `blocks` JSON,
                `status` INTEGER NOT NULL DEFAULT 0,
                `ownField1` TEXT,
                `ownField2` INTEGER
            )");
            $db->exec("INSERT INTO `pageTypes` VALUES
                ({$id},'MyProducts','my-products','" . json_encode([
                    "ownFields" => $pageType->ownFields,
                    "blockFields" => [(object) ["type" => "Paragraph", "title" => "", "defaultRenderer" => "sivujetti:block-auto",
                                                "initialData" => (object) ["text" => "Paragraph text", "cssClass" => ""],
                                                "children" => []]],
                    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "Product name"]],
                ]) . "','1',1)");
        });
        return $pageType;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     */
    public function dropCustomPageType(PageType $pageType): void {
        $this->createPageRepo->__invoke(function ($db, $fakeTheWebsite, $_testAppStorage) use ($pageType) {
            $idx = array_search($pageType, $fakeTheWebsite->pageTypes->getArrayCopy());
            $fakeTheWebsite->pageTypes->offsetUnset($idx);
            $id = 100 + $idx;
            //
            $db->exec("DROP TABLE `\${p}{$pageType->name}`");
            $db->exec("DELETE FROM `pageTypes` WHERE `id` = ?", [$id]);
        });
    }
    /**
     * @param ?SharedAPIContext $initial = null
     * @return \Sivujetti\SharedAPIContext
     */
    public static function createTestAPIStorage(?SharedAPIContext $initial = null): SharedAPIContext {
        $out = $initial ?? new SharedAPIContext;
        if ($out->getDataHandle()->blockTypes === null) {
            $blockTypes = new BlockTypes;
            $blockTypes->{Block::TYPE_GLOBAL_BLOCK_REF} = new GlobalBlockReferenceBlockType;
            $blockTypes->{Block::TYPE_HEADING} = new HeadingBlockType;
            $blockTypes->{Block::TYPE_PARAGRAPH} = new ParagraphBlockType;
            $blockTypes->{Block::TYPE_SECTION} = new SectionBlockType;
            $out->getDataHandle()->blockTypes = $blockTypes;
        }
        return $out;
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
        return $this->pagesRepo->getSingle($pageType, ...$filters);
    }
}
