<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Db;
use Sivujetti\Block\BlockValidator;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{HeadingBlockType, ParagraphBlockType, SectionBlockType};
use Sivujetti\Page\Entities\Page;
use Sivujetti\Page\{PagesRepository, SelectQuery};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\SharedAPIContext;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\BlockType\Entities\BlockTypes;

final class PageTestUtils {
    /** @var \Sivujetti\Page\PagesRepository */
    private PagesRepository $pagesRepo;
    /**
     * @param \Pike\Db $db
     * @param ?\Sivujetti\SharedAPIContext $testAppStorage = null
     */
    public function __construct(Db $db, ?SharedAPIContext $testAppStorage = null) {
        $fakeTheWebsite = new TheWebsite;
        $fakeTheWebsite->pageTypes = new \ArrayObject;
        $pagePageType = $this->makeDefaultPageType();
        $fakeTheWebsite->pageTypes[] = $pagePageType;
        if (!$testAppStorage) {
            $testAppStorage = new SharedAPIContext;
        }
        if ($testAppStorage->getDataHandle()->blockTypes === null) {
            $blockTypes = new BlockTypes;
            $blockTypes->{Block::TYPE_HEADING} = new HeadingBlockType;
            $blockTypes->{Block::TYPE_PARAGRAPH} = new ParagraphBlockType;
            $blockTypes->{Block::TYPE_SECTION} = new SectionBlockType;
            $testAppStorage->getDataHandle()->blockTypes = $blockTypes;
        }
        $this->pagesRepo = new PagesRepository($db, $fakeTheWebsite,
            $testAppStorage->getDataHandle()->blockTypes,
            new PageTypeValidator(new BlockValidator($testAppStorage))
        );
    }
    /**
     * @param object $data 
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?string $lastInsertId or null
     */
    public function insertPage(object $data, ?PageType $pageType = null): ?string {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
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
        return $this->t($pageType)->where('${t}.`slug`=?', $slug)->exec();
    }
    /**
     * @param string $id
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    public function getPageById(string $id, ?PageType $pageType = null): ?Page {
        return $this->t($pageType)->where('${t}.`id`=?', $id)->exec();
    }
    /**
     * @return \Sivujetti\PageType\Entities\PageType
     */
    public function makeDefaultPageType(): PageType {
        $pageType = new PageType;
        $pageType->name = PageType::PAGE;
        $pageType->ownFields = [(object) ["name" => "categories", "dataType" => "json"]];
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
            "layoutId" => 1,
            "blocks" => $blocks ?? self::makeDefaultBlockTree(),
            "categories" => "[]",
            "status" => Page::STATUS_PUBLISHED,
        ];
    }
    /**
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private static function makeDefaultBlockTree(): array {
        $btu = new BlockTestUtils();
        return [$btu->makeBlockData(Block::TYPE_SECTION, "Main", "sivujetti:block-generic-wrapper", children: [
            $btu->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Hello", "level" => 2, "cssClass" => ""]),
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Text", "cssClass" => ""]),
        ], propsData: ["cssClass" => "", "bgImage" => ""])];
    }
    /**
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return ?\Sivujetti\Page\Entities\Page
     */
    private function t(?PageType $pageType = null): SelectQuery {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        return $this->pagesRepo->getSingle($pageType);
    }
}
