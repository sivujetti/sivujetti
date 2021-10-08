<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\Block\BlockValidator;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\ValidationUtils;
use Pike\{Validation};

final class PageTypeValidator {
    /** @var \Sivujetti\Block\BlockValidator */
    private BlockValidator $blockValidator;
    /**
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function __construct(BlockValidator $blockValidator) {
        $this->blockValidator = $blockValidator;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $input
     * @param bool $doValidateBlockTypes = false
     * @return string[] Error messages or []
     */
    public function validateInsertData(PageType $pageType,
                                       object $input,
                                       bool $doValidateBlockTypes = false): array {
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
        if (!($errors = $v->validate($input)) && $doValidateBlockTypes)
            $errors = $this->blockValidator->validateMany($input->blocks);
        return $errors;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $input
     * @param bool $doValidateBlockTypes = false
     * @return string[] Error messages or []
     */
    public function validateUpdateData(PageType $pageType,
                                       object $input,
                                       bool $doValidateBlockTypes = false): array {
        $v = ValidationUtils::addRulesForProperties($pageType->ownFields,
            Validation::makeObjectValidator()
                ->rule("slug", "type", "string")
                ->rule("path", "type", "string")
                ->rule("level", "type", "number")
                ->rule("title", "type", "string")
                ->rule("layoutId", "type", "number")
                ->rule("layoutId", "min", 1)
                ->rule("status", "type", "number")
                ->rule("status", "min", Page::STATUS_PUBLISHED)
        );
        if (!($errors = $v->validate($input)) && $doValidateBlockTypes)
            $errors = $this->blockValidator->validateMany($input->blocks);
        return $errors;
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    public function validateBlocksUpdateData(object $input): array {
        if (($errors = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $this->blockValidator->validateMany($input->blocks);
    }
}
