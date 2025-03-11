<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Sivujetti\BlockType\{PropertiesBuilder};
use Sivujetti\{SharedAPIContext, Template, ValidationUtils};
use Pike\{Validation};
use Pike\Validation\ObjectValidator;

/**
 * @phpstan-type BlockInput (object{blockType: string} & \stdClass)|object
 * @phpstan-type BlockBlueprintInput (object{type: string} & \stdClass)|object
 */
final class BlockValidator {
    /** @var list<string> */
    private array $validBlockRenderers;
    /** @var object */
    private object $blockTypes;
    /**
     * @param \Sivujetti\SharedAPIContext $apiCtx
     */
    public function __construct(SharedAPIContext $apiCtx) {
        $expandedFileIds = ["jsx"];
        foreach ($apiCtx->blockRenderers as $renderer) {
            $fileId = $renderer["fileId"];
            $expandedFileIds[] = $fileId;
            if (str_starts_with($fileId, "site:")) $expandedFileIds[] = explode(":", $fileId)[1];
        }
        $this->validBlockRenderers = $expandedFileIds;
        $this->blockTypes = $apiCtx->blockTypes;
    }
    /**
     * @param BlockInput|BlockBlueprintInput $input
     * @param ?\Pike\Validation\ObjectValidator $validator = null
     * @return list<string> Error messages or []
     */
    public function validateInsertOrUpdateData(object $input, ?ObjectValidator $validator = null): array {
        $entityType = "Block";
        $blockTypeStr = "";
        if (property_exists($input, "type")) {
            $blockTypeStr = $input->type;
        } elseif (property_exists($input, "blockType")) {
            $blockTypeStr = $input->blockType;
            $entityType = "BlockBlueprint";
        } else {
            return ["Expected \$input to be a `Block` or `BlockBlueprint`"];
        }

        if (!($blockType = $this->blockTypes->{$blockTypeStr} ?? null))
            return ["Unknown block type `" . Template::e($blockTypeStr) . "`"];
        $v = $this->addRulesForDefaultProps(
            ($validator ?? Validation::makeObjectValidator())
                ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
                ->addRuleImpl(...ValidationUtils::createUrlValidatorImpl()),
            $entityType === "Block" ? "" : "initialDefaultsData."
        );
        return ValidationUtils::addRulesForProperties(
            $blockType->defineProperties(new PropertiesBuilder),
            $entityType === "Block" ? $v->rule("id", "type", "string")->rule("id", "pushId") : $v,
            $entityType === "Block" ? "" : "initialOwnData."
        )->validate($input);
    }
    /**
     * @param list<object> $branch
     * @return list<string> Error messages or e[]
     */
    public function validateMany(array $branch): array {
        foreach ($branch as $blockData) {
            if (($errors = $this->validateInsertOrUpdateData($blockData)))
                return $errors;
            if ($blockData->children && ($errors = $this->validateMany($blockData->children)))
                return $errors;
        }
        return [];
    }
    /**
     * @return list<string>
     */
    public function getValidBlockTypeNames(): array {
        return array_keys(get_object_vars($this->blockTypes));
    }
    /**
     * @return list<string>
     */
    public function getValidBlockRenderers(): array {
        return $this->validBlockRenderers;
    }
    /**
     * @param \Pike\Validation\ObjectValidator $validator
     * @param string $pathPrefix = ""
     * @return \Pike\Validation\ObjectValidator
     */
    private function addRulesForDefaultProps(ObjectValidator $validator, string $pathPrefix = ""): ObjectValidator {
        return $validator
            ->rule("{$pathPrefix}title", "type", "string")
            ->rule("{$pathPrefix}title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("{$pathPrefix}renderer", "in", $this->validBlockRenderers)
            ->rule("{$pathPrefix}styleClasses", "type", "string")
            ->rule("{$pathPrefix}styleClasses", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule(!$pathPrefix ? "children?" : "initialChildren?", "type", "array");
    }
}
