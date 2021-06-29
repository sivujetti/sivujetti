<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Page\Entities\Page;
use KuuraCms\PageType\Entities\PageType;

final class PagesRepository {
    public function getSingle(PageType $pageType) {
        return new class {
            function where() {
                return $this;
            }
            function exec() {
                $out = new Page;
                $out->title = 'todo';
                $out->layoutId = '1';
                return $out;
            }
        };
    }
}
