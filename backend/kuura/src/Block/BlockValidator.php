<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\BlockType\BlockTypeInterface;
use KuuraCms\ValidationUtils;
use Pike\Validation;

final class BlockValidator {
    /**
     * @param \KuuraCms\BlockType\BlockTypeInterface $blockType 
     * @param object $input
     * @return string[] Error messages or []
     */
    public static function validateInsertOrUpdateData(BlockTypeInterface $blockType,
                                                      object $input): array {
        return ValidationUtils::addRulesForProperties(
            $blockType->defineProperties(),
            Validation::makeObjectValidator()
                ->rule("title", "type", "string")
                ->rule("title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
                ->rule("renderer", "in", ["kuura:block-auto", "kuura:block-generic-wrapper"])
                ->rule("id", "minLength", 20)
                ->rule("id", "maxLength", 20)
        )->validate($input);
    }
}
