<?php declare(strict_types=1);

namespace KuuraCms\Tests\Utils;

use KuuraCms\Page\Entities\Page;
use KuuraCms\Page\PagesRepository;
use KuuraCms\PageType\Entities\PageType;
use Pike\Db;

final class PageTestUtils {
    /** @var \KuuraCms\Page\PagesRepository */
    private PagesRepository $pagesRepo;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->pagesRepo = new PagesRepository($db);
    }
    /**
     * @param object $data 
     * @param ?\KuuraCms\PageType\Entities\PageType $pageType = null
     * @return ?string $lastInsertId or null
     */
    public function insertPage(object $data, ?PageType $pageType = null): ?string {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        return $this->pagesRepo->insert($pageType, $data)
            ? $this->pagesRepo->lastInsertId
            : null;
    }
    /**
     * @param string $slug 
     * @param ?\KuuraCms\PageType\Entities\PageType $pageType = null
     * @return ?\KuuraCms\Page\Entities\Page
     */
    public function getPage(string $slug, ?PageType $pageType = null): ?Page {
        if (!$pageType)
            $pageType = $this->makeDefaultPageType();
        return $this->pagesRepo->getSingle($pageType)->where('${t}.`slug`=?', $slug)->exec();
    }
    /**
     * @return \KuuraCms\PageType\Entities\PageType
     */
    public function makeDefaultPageType(): PageType {
        $pageType = new PageType;
        $pageType->name = PageType::PAGE;
        $pageType->ownFields = [(object) ["name" => "categories"]];
        return $pageType;
    }
}
