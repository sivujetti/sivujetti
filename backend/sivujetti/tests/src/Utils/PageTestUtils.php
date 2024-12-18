<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\{Db, PikeException};
use Sivujetti\Block\{BlocksController, BlockValidator};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, CodeBlockType, GlobalBlockReferenceBlockType,
                         MenuBlockType, Section2BlockType, SectionBlockType, TextBlockType};
use Sivujetti\Page\Entities\Page;
use Sivujetti\Page\{PagesRepository};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\{PageTypeMigrator, PageTypesController, PageTypeValidator};
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\{JsonUtils, SharedAPIContext};

/**
 * @psalm-import-type SelectFilters from \Sivujetti\Page{PagesRepository
*/
final class PageTestUtils {
    public const TEST_LAYOUT_FILENAME = "layout.default.tmpl.php";
    /** @var \Sivujetti\Tests\Utils\LayoutTestUtils */
    public LayoutTestUtils $layoutTestUtils;
    /** @var \Sivujetti\Page\PagesRepository */
    private PagesRepository $pagesRepo;
    /** @var \Sivujetti\BlockType\Entities\BlockTypes */
    private BlockTypes $blockTypes;
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
        $this->blockTypes = $testApiCtx->blockTypes;
        $this->layoutTestUtils = new LayoutTestUtils($db);
        $this->createPageRepo = function (\Closure $doBefore) use ($db, $fakeTheWebsite, $testApiCtx) {
            $doBefore($db, $fakeTheWebsite, $testApiCtx);
            $this->pagesRepo = new PagesRepository($db, $fakeTheWebsite,
                new PageTypeValidator(new BlockValidator($testApiCtx))
            );
        };
        $this->createPageRepo->__invoke(function () {});
    }
    /**
     * @param object $data \Sivujetti\Page\Entities\Page|object
     * @param \Sivujetti\PageType\Entities\PageType|string|null $pageType = null
     */
    public function insertPage(object $data, PageType|string|null $pageType = null): void {
        if (!($pageType instanceof PageType))
            $pageType = $this->makeDefaultPageType($pageType);
        if ($data->layoutId)
            $this->layoutTestUtils->insertLayout((object) ["id" => $data->layoutId]);
        [$_numAffectedRows, $errors] = $this->pagesRepo->insert($pageType, $data,
            JsonUtils::stringify(BlocksController::makeStorableBlocksDataFromValidInput(
                $data->blocks, $this->blockTypes)));
        if ($errors)
            throw new PikeException(implode("\n", $errors));
    }
    /**
     * @param string $slug
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    public function getPageBySlug(string $slug, ?PageType $pageType = null): ?Page {
        if (($out = $this->t(["filters" => [
            ["slug", $slug],
        ]], $pageType))) {
            unset($out->blocks);
            unset($out->layout);
            unset($out->layoutFriendlyName);
            unset($out->layoutRelFilePath);
            unset($out->layoutStructureJson);
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
        return $this->t(["filters" => [
            ["p.`id`", $id],
        ]], $pageType);
    }
    /**
     * @param ?string $input
     * @return \Sivujetti\PageType\Entities\PageType
     */
    public function makeDefaultPageType(?string $input = null): PageType {
        $pageType = new PageType;
        if ($input === "PagesCategories") {
            $pageType->name = "PagesCategories";
            $pageType->ownFields = [];
        } else { // null or "Pages"
            $pageType->name = PageType::PAGE;
            $pageType->ownFields = [(object) [
                "name" => "categories",
                "friendlyName" => "",
                "dataType" => (object) ["type" => "many-to-many", "isNullable" => false, "rel" => "PagesCategories"],
                "defaultValue" => [],
            ]];
        }
        return $pageType;
    }
    /**
     * @param ?array<int, \Sivujetti\Block\Entities\Block> $blocks = null
     * @param ?string $pageTypeName = null
     * @param ?string $id = null
     * @return object
     */
    public function makeTestPageData(?array $blocks = null, ?string $pageTypeName = null, ?string $id = null): object {
        if ($pageTypeName === "PagesCategories") {
            $out = $this->makeTestPageData($blocks, null, $id);
            $out->slug = "/uncategorized";
            $out->path = "pages-categories/uncategorized/";
            $out->title = "Uncategorized";
            unset($out->categories);
            return $out;
        }
        $now = time();
        return (object) [
            "id" => $id ?? "-pppppppppppppppppp1",
            "slug" => "/hello",
            "path" => "hello/",
            "level" => 1,
            "title" => "<Hellö>",
            "meta" => (object) [
                "description" => "Greetings >",
                "socialImage" => (object) ["src" => "gradient-background.jpg", "mime" => "image/jpeg",
                    "height" => 1600, "width" => 1068]
            ],
            "layoutId" => "1",
            "blocks" => $blocks ?? self::makeDefaultBlockTree(),
            "categories" => [],
            "status" => Page::STATUS_PUBLISHED,
            "createdAt" => $now,
            "lastUpdatedAt" => $now,
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
            (object) ["name" => "ownField1", "dataType" => (object) ["type" => "text",
                        "isNullable" => false, "length" => null, "validationRules" => null],
                      "friendlyName" => "Some prop", "defaultValue" => "foo"],
            (object) ["name" => "ownField2", "dataType" => (object) ["type" => "uint",
                        "isNullable" => false, "length" => null, "validationRules" => null],
                      "friendlyName" => "Some prop2", "defaultValue" => 123],
        ];
        //
        $this->createPageRepo->__invoke(function ($db, $fakeTheWebsite, $testApiCtx) use ($pageType) {
            $fakeTheWebsite->pageTypes[] = $pageType;
            $id = 100 + array_search($pageType, $fakeTheWebsite->pageTypes->getArrayCopy());
            //
            $m = new PageTypeMigrator($db, new PageTypeValidator(new BlockValidator($testApiCtx)));
            $cfg = PageTypesController::createEmptyPageTypeInput();
            $cfg->id = $id;
            $cfg->name = "MyProducts";
            $cfg->slug = "/my-products";
            $cfg->friendlyName = "Products";
            $cfg->friendlyNamePlural = "Products";
            // $cfg->description = use default;
            // $cfg->blockBlueprintFields = use default;
            $cfg->ownFields = $pageType->ownFields;
            $cfg->defaultFields->title->defaultValue = "Product name";
            // $cfg->defaultLayoutId = use default;
            $cfg->status = PageType::STATUS_COMPLETE;
            // $cfg->isListable = use default;
            $m->install($cfg, asPlaceholder: false);
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
            $blockTypes->{Block::TYPE_CODE} = new CodeBlockType;
            $blockTypes->{Block::TYPE_GLOBAL_BLOCK_REF} = new GlobalBlockReferenceBlockType;
            $blockTypes->{Block::TYPE_MENU} = new MenuBlockType;
            $blockTypes->{Block::TYPE_SECTION} = new SectionBlockType;
            $blockTypes->{Block::TYPE_SECTION2} = new Section2BlockType;
            $blockTypes->{Block::TYPE_TEXT} = new TextBlockType;
            $out->blockTypes = $blockTypes;
        }
        if (!$out->blockRenderers)
            $out->blockRenderers = array_merge($out->blockRenderers, [
                ["fileId" => "sivujetti:block-auto", "friendlyName" => null, "associatedWith" => null], // Text, Button etc.
                ["fileId" => "sivujetti:block-generic-wrapper", "friendlyName" => null, "associatedWith" => null], // Columns, Section
            ]);
        return $out;
    }
    /**
     * @param object $input
     * @return object {description: string}
     */
    public static function createCleanMetaFromInput(object $input): object {
        return (object) [
            "description" => $input->description,
            "socialImage" => $input->socialImage ?? null
        ];
    }
    /**
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private static function makeDefaultBlockTree(): array {
        $btu = new BlockTestUtils();
        return [$btu->makeBlockData(
            type: Block::TYPE_SECTION,
            title: "Main",
            children: [
                $btu->makeBlockData(Block::TYPE_TEXT, propsData: ["html" => "<h2>Hello</h2>"]),
                $btu->makeBlockData(Block::TYPE_TEXT, propsData: ["html" => "<p>Text</p>"]),
            ],
            propsData: [
                "bgImage" => null,
            ]
        )];
    }
    /**
     * @psalm-param SelectFilters $filters
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    private function t(array $filters, ?PageType $pageType = null): ?Page {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        return $this->pagesRepo->getSingle($pageType, $filters);
    }
}
