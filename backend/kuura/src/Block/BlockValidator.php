<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\BlockType\BlockTypeInterface;
use KuuraCms\ValidationUtils;
use Pike\{PikeException, Validation};

final class BlockValidator {
    private const VALIDATION_RULES = ["type", "minLength", "maxLength", "min",
                                      "max", "in", "identifier", "regexp"];
    /**
     * @param \KuuraCms\BlockType\BlockTypeInterface $blockType 
     * @param object $input
     * @return string[] Error messages or []
     */
    public static function validateInsertData(BlockTypeInterface $blockType,
                                              object $input): array {
        $v = Validation::makeObjectValidator()
            ->rule("title", "type", "string")
            ->rule("title", "maxLength", ValidationUtils::HARD_STRING_LIMIT)
            ->rule("renderer", "in", ["kuura:block-auto", "kuura:generic-wrapper"])
            ->rule("id", "minLength", 20)
            ->rule("id", "maxLength", 20)
            ->rule("parentBlockId", "type", "string");
        //
        foreach ($blockType->defineProperties() as $prop) {
            $rules = [
                "text" => [["type", "string"]],
                "json" => [["type", "string"]],
                "int" => [["type", "number"]],
                "uint" => [["type", "number"], ["min", 0]],
            ][$prop->dataType] ?? null;
            if (!$rules)
                throw new \RuntimeException("Shouldn't happen");
            $userRules = $prop->validationRules ?? [];
            if ($userRules) { // e.g. [ ["required"], ["min", 4] ]
                foreach ($userRules as $ruleParts) {
                    if (!is_array($ruleParts) || !in_array($ruleParts[0], self::VALIDATION_RULES, true))
                        throw new PikeException("Invalid validation rule",
                                                PikeException::BAD_INPUT);
                }
                $rules = array_merge($rules, $userRules);
            }
            foreach ($rules as $ruleArgs) {
                $v->rule("{$prop->name}", ...$ruleArgs);
            }
        }
        return $v->validate($input);
    }
}
