<?php declare(strict_types=1);

namespace KuuraCms\Tests\Utils;

use KuuraCms\Block\BlockValidator;
use KuuraCms\Block\Entities\Block;
use KuuraCms\BlockType\{HeadingBlockType, ParagraphBlockType, SectionBlockType};
use KuuraCms\Page\Entities\Page;
use KuuraCms\Page\{PagesRepository, SelectQuery};
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\PageType\PageTypeValidator;
use KuuraCms\SharedAPIContext;
use KuuraCms\TheWebsite\Entities\TheWebsite;
use Pike\Db;

final class PageTestUtils {
    /** @var \KuuraCms\Page\PagesRepository */
    private PagesRepository $pagesRepo;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $fakeTheWebsite = new TheWebsite;
        $fakeTheWebsite->pageTypes = new \ArrayObject;
        $pagePageType = $this->makeDefaultPageType();
        $fakeTheWebsite->pageTypes[] = $pagePageType;
        $fakeApiStorage = new SharedAPIContext;
        $fakeApiStorage->getDataHandle()->blockTypes = (object) [
            Block::TYPE_HEADING => new HeadingBlockType,
            Block::TYPE_PARAGRAPH => new ParagraphBlockType,
            Block::TYPE_SECTION => new SectionBlockType,
        ];
        $this->pagesRepo = new PagesRepository($db, $fakeTheWebsite, $fakeApiStorage,
            new PageTypeValidator(new BlockValidator($fakeApiStorage)));
    }
    /**
     * @param object $data 
     * @param ?\KuuraCms\PageType\Entities\PageType $pageType = null
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
     * @param ?\KuuraCms\PageType\Entities\PageType $pageType = null
     * @return ?\KuuraCms\Page\Entities\Page
     */
    public function getPageBySlug(string $slug, ?PageType $pageType = null): ?Page {
        return $this->t($pageType)->where('${t}.`slug`=?', $slug)->exec();
    }
    /**
     * @param string $id
     * @param ?\KuuraCms\PageType\Entities\PageType $pageType = null
     * @return ?\KuuraCms\Page\Entities\Page
     */
    public function getPageById(string $id, ?PageType $pageType = null): ?Page {
        return $this->t($pageType)->where('${t}.`id`=?', $id)->exec();
    }
    /**
     * @return \KuuraCms\PageType\Entities\PageType
     */
    public function makeDefaultPageType(): PageType {
        $pageType = new PageType;
        $pageType->name = PageType::PAGE;
        $pageType->ownFields = [(object) ["name" => "categories", "dataType" => "json"]];
        return $pageType;
    }
    /**
     * @param ?array<int, \KuuraCms\Block\Entities\Block> $blocks = null
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
     * @return \KuuraCms\Block\Entities\Block[]
     */
    private static function makeDefaultBlockTree(): array {
        $btu = new BlockTestUtils();
        return [$btu->makeBlockData(Block::TYPE_SECTION, "Main", "kuura:block-generic-wrapper", children: [
            $btu->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Hello", "level" => 2, "cssClass" => ""]),
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Text", "cssClass" => ""]),
        ], propsData: ["cssClass" => "", "bgImage" => ""])];
    }
    /**
     * @param ?\KuuraCms\PageType\Entities\PageType $pageType = null
     * @return ?\KuuraCms\Page\Entities\Page
     */
    private function t(?PageType $pageType = null): SelectQuery {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        return $this->pagesRepo->getSingle($pageType);
    }
}
