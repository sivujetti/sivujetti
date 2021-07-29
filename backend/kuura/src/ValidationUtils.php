<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\{ObjectValidator, PikeException};

abstract class ValidationUtils {
    public const HARD_SHORT_TEXT_MAX_LEN = 1024;
    public const HARD_LONG_TEXT_MAX_LEN = 128000;
    public const HARD_JSON_TEXT_MAX_LEN = 256000;
    private const VALID_RULES = ["type", "minLength", "maxLength", "min",
                                 "max", "in", "identifier", "regexp"];
    /**
     * Throws an exception if $path contains './', '../', or '/' (strict).
     *
     * @param string $path
     * @param bool $strict = false
     */
    public static function checkIfValidaPathOrThrow(string $path,
                                                    bool $strict = false): void {
        if (str_contains($path, $strict ? '/' : './'))
            throw new PikeException("`{$path}` is not valid path",
                                    PikeException::BAD_INPUT);
    }
    /**
     * @param array|\ArrayObject $properties
     * @param \Pike\ObjectValidator $to
     * @return \Pike\ObjectValidator
     */
    public static function addRulesForProperties(array|\ArrayObject $properties,
                                                 ObjectValidator $to): ObjectValidator {
        foreach ($properties as $prop) {
            if (!property_exists($prop, 'dataType')) {
            var_dump($prop);
            throw new \RuntimeException('ff');
            }
            $rules = [
                "text" => [["type", "string"], ["maxLength", self::HARD_SHORT_TEXT_MAX_LEN]],
                "json" => [["type", "string"], ["maxLength", self::HARD_JSON_TEXT_MAX_LEN]],
                "int" =>  [["type", "number"]],
                "uint" => [["type", "number"], ["min", 0]],
            ][$prop->dataType] ?? null;
            if (!$rules)
                throw new \RuntimeException("Shouldn't happen");
            $userRules = $prop->validationRules ?? [];
            if ($userRules) { // e.g. [ ["required"], ["min", 4] ]
                foreach ($userRules as $ruleParts) {
                    if (!is_array($ruleParts) || !in_array($ruleParts[0], self::VALID_RULES, true))
                        throw new PikeException("Invalid validation rule",
                                                PikeException::BAD_INPUT);
                }
                $rules = array_merge($rules, $userRules);
            }
            foreach ($rules as $ruleArgs) {
                $to->rule("{$prop->name}", ...$ruleArgs);
            }
        }
        return $to;
    }
}
