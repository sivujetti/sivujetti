<?php declare(strict_types=1);

namespace KuuraCms\PageType;

use KuuraCms\PageType\Entities\PageType;

abstract class PageTypeValidator {
    /**
     * @param \KuuraCms\PageType\Entities\PageType $pageType
     * @param object $input
     * @return string[] Error messages or empty array
     */
    public static function validateInsertData(PageType $pageType,
                                              object $input): array {
        return [];
    }
}
