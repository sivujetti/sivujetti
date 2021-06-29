<?php declare(strict_types=1);

namespace KuuraCms\TheWebsite;

use Pike\Db;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\TheWebsite\Entities\TheWebsite;

final class TheWebsiteRepository {
    /**
     * @param \Pike\Db $db
     * @return ?\KuuraCms\TheWebsite\Entities\TheWebsite
     */
    public static function fetchActive(Db $db): ?TheWebsite {
        $out = new TheWebsite;
        $out->name = 'MySite';
        $out->lang = 'fi';
        $out->pageTypes = new \ArrayObject;
        $p = new PageType;
        $p->name = PageType::PAGE;
        $out->pageTypes[] = $p;
        return $out;
    }
}
