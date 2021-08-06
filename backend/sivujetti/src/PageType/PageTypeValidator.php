<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\Block\BlockValidator;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\ValidationUtils;
use Pike\{PikeException, Validation};

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
     * @param ?object $blockTypes = null null -> Do not validate $input->blocks, object -> Do validate $input->blocks using $blockTypes.*.defineProperties()
     * @return string[] Error messages or []
     */
    public function validateInsertData(PageType $pageType,
                                       object $input,
                                       ?object $blockTypes = null): array {
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
            $errors = $this->validateBlocks($input->blocks, $blockTypes);
        return $errors;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $input
     * @param ?object $blockTypes = null null -> Do not validate $input->blocks, object -> Do validate $input->blocks using $blockTypes.*.defineProperties()
     * @return string[] Error messages or []
     */
    public function validateUpdateData(PageType $pageType,
                                       object $input,
                                       ?object $blockTypes = null): array {
        $v = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array");
        if (!($errors = $v->validate($input)) && $blockTypes)
            $errors = $this->validateBlocks($input->blocks, $blockTypes);
        return $errors;
    }
    /**
     * @param object[] $branch
     * @param object $blockTypes
     * @return string[] Error messages or e[]
     */
    private function validateBlocks(array $branch, object $blockTypes): array {
        foreach ($branch as $blockData) {
            if (($errors = $this->blockValidator->validateInsertOrUpdateData($blockData->type, $blockData)))
                return $errors;
            if ($blockData->children && ($errors = $this->validateBlocks($blockData->children, $blockTypes)))
                return $errors;
        }
        return [];
    }
}
