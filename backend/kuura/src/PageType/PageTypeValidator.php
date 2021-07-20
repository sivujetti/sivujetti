<?php declare(strict_types=1);

namespace KuuraCms\PageType;

use KuuraCms\Block\BlockValidator;
use KuuraCms\Page\Entities\Page;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\ValidationUtils;
use Pike\{PikeException, Validation};

abstract class PageTypeValidator {
    /**
     * @param \KuuraCms\PageType\Entities\PageType $pageType
     * @param object $input
     * @param ?object $blockTypes = null null -> Do not validate $input->blocks, object -> Do validate $input->blocks using $blockTypes.*.defineProperties()
     * @return string[] Error messages or []
     */
    public static function validateInsertData(PageType $pageType,
                                              object $input,
                                              object $blockTypes = null): array {
        $v = ValidationUtils::addRulesForProperties($pageType->ownFields,
            Validation::makeObjectValidator()
                ->rule("slug", "type", "string")
                ->rule("path", "type", "string")
                ->rule("level", "type", "number")
                ->rule("title", "type", "string")
                ->rule("layoutId", "type", "number")
                ->rule("layoutId", "min", 1)
                ->rule("blocks", "type", "array")
                ->rule("status", "type", "number")
                ->rule("status", "min", Page::STATUS_PUBLISHED)
        );
        if (!($errors = $v->validate($input)) && $blockTypes)
            $errors = self::validateBlocks($input->blocks, $blockTypes);
        return $errors;
    }
    /**
     * @param \KuuraCms\PageType\Entities\PageType $pageType
     * @param object $input
     * @param ?object $blockTypes = null null -> Do not validate $input->blocks, object -> Do validate $input->blocks using $blockTypes.*.defineProperties()
     * @return string[] Error messages or []
     */
    public static function validateUpdateData(PageType $pageType,
                                              object $input,
                                              object $blockTypes = null): array {
        $v = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array");
        if (!($errors = $v->validate($input)) && $blockTypes)
            $errors = self::validateBlocks($input->blocks, $blockTypes);
        return $errors;
    }
    /**
     * @param object[] $branch
     * @param object $blockTypes
     * @return string[] Error messages or e[]
     */
    private static function validateBlocks(array $branch, object $blockTypes): array {
        foreach ($branch as $blockData) {
            if (!($bt = $blockTypes->{$blockData->type} ?? null))
                throw new PikeException("Unknown block type `{$blockData->type}`",
                                        PikeException::BAD_INPUT);
            if (($errors = BlockValidator::validateInsertOrUpdateData($bt, $blockData)))
                return $errors;
            if ($blockData->children && ($errors = self::validateBlocks($blockData->children, $blockTypes)))
                return $errors;
        }
        return [];
    }
}
