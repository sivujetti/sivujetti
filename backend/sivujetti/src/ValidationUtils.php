<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{ArrayUtils, PikeException, Validation};
use Pike\Validation\ObjectValidator;

/**
 * @psalm-import-type RawPageTypeField from \Sivujetti\PageType\Entities\Field
 */
abstract class ValidationUtils {
    public const HARD_SHORT_TEXT_MAX_LEN = 1024;
    public const HARD_LONG_TEXT_MAX_LEN = 128000;
    public const HARD_JSON_TEXT_MAX_LEN = 256000;
    public const EMAIL_REGEXP_SIMPLE = "/^.+@.+$/";
    public const INDEX_STR_MAX_LENGTH = 92;
    public const SLUG_MAX_LENGTH = 92;
    public const SLUG_REGEXP_SIMPLE = "/^\/[a-zA-Z0-9_-]+$/";
    private const VALID_RULES = ["type","stringType","minLength","maxLength","min","max",
                                 "in","contains","notContains","identifier","regexp",
                                 "pageUrl"];
    /**
     * Throws an exception if $path contains "./", "../", or "/" (strict).
     *
     * @param string $path
     * @param bool $strict = false
     */
    public static function checkIfValidaPathOrThrow(string $path,
                                                    bool $strict = false): void {
        if (str_contains($path, $strict ? "/" : "./"))
            throw new PikeException("`{$path}` is not valid path",
                                    PikeException::BAD_INPUT);
    }
    /**
     * @return array{0: string, 1: \Closure, 2: string}
     */
    public static function createUrlValidatorImpl(): array {
        return ["pageUrl",
        /**
         * @param mixed $value
         * @param array{allowExternal?: bool} $settings = []
         * @return bool
         */
        function ($value, array $settings = []): bool {
            if (!is_string($value)) return false;

            // Had funky escapes -> always reject
            if (str_contains($value, "\\")) return false;

            $noWhitespace = trim($value);
            // Had whitespace or was empty -> always reject
            if ($noWhitespace !== $value || !$noWhitespace) return false;

            // Local urls always start with `/`
            $isLocal = $noWhitespace[0] === "/";
            $allowExternal = $settings["allowExternal"] ?? true;

            if ($isLocal) {
                // Can contain anything except `//` and `./` (or `.%2F`)
                return str_contains($noWhitespace, "./") ||
                    str_contains($noWhitespace, "//") ? false : true;
            } else {
                if (!$allowExternal)
                    return false;

                if (($parts = parse_url($noWhitespace)) === false)
                    return false;

                // Always require protocol
                if (!strlen($parts["scheme"] ?? ""))
                    return false;

                // If present, can contain anything except `//` and `./`
                if (is_string($parts["path"] ?? null) && (
                    str_contains($parts["path"], "./") ||
                    str_contains($parts["path"], "//")
                )) return false;
            }

            return true;
        }, "%s is not valid"];
    }
    /**
     * @return array{0: string, 1: \Closure, 2: string}
     */
    public static function createPushIdValidatorImpl(): array {
        return ["pushId", fn($value) =>
            is_string($value) &&
            strlen($value) === 20 &&
            Validation::isStringType(str_replace(["_", "-"], "", $value), "alnum")
        , "%s is not valid push id"];
    }
    /**
     * @psalm-param array<int, RawPageTypeField>|\ArrayObject $properties pageType->ownFields or $blockType->defineProperties()
     * @param \Pike\Validation\ObjectValidator $to
     * @return \Pike\Validation\ObjectValidator
     */
    public static function addRulesForProperties(array|\ArrayObject $properties,
                                                 ObjectValidator $to): ObjectValidator {
        foreach ($properties as $prop) {
            $dt = $prop->dataType;
            $defaultRules = [
                "text"         => [["", "type", "string"], ["", "maxLength", self::HARD_SHORT_TEXT_MAX_LEN]],
                "json"         => [["", "type", "string"], ["", "maxLength", self::HARD_JSON_TEXT_MAX_LEN]],
                "many-to-many" => [["", "type", "array"],  ["%s.*", "type", "string"]],
                "int"          => [["", "type", "number"]],
                "uint"         => [["", "type", "number"], ["", "min", 0]],
            ][$dt->type] ?? null;
            if (!$defaultRules)
                throw new \RuntimeException("Shouldn't happen");
            $userRules = $dt->validationRules ?? [];
            foreach (self::createMergedRules($userRules, $defaultRules) as $parts) {
                $pathTmpl = array_shift($parts);
                $propPath = (!$pathTmpl ? $prop->name : sprintf($pathTmpl, $prop->name)) .
                            (!$dt->isNullable ? "" : "?");
                $to->rule($propPath, ...$parts);
            }
        }
        return $to;
    }
    /**
     * @param array<int, array<int, mixed> $userRules e.g. [ ["", "required"], ["%s.foo", "min", 4] ]
     * @param array<int, array<int, mixed> $defaultRules
     * @return array<int, array<int, mixed>
     */
    private static function createMergedRules(array $userRules, array $defaultRules): array {
        if (!$userRules) return $defaultRules;
        //
        $combined = $defaultRules;
        foreach ($userRules as $ruleParts) {
            if (!is_array($ruleParts) ||
                !is_string($ruleParts[0]) ||
                !in_array($ruleParts[1], self::VALID_RULES, true))
                throw new PikeException("Invalid validation rule",
                                        PikeException::BAD_INPUT);
            $idx = ArrayUtils::findIndexByKey($defaultRules, $ruleParts[1], "1");
            $fromDefault = $idx > -1 ? $defaultRules[$idx] : null;
            $existInDefault = $fromDefault && $fromDefault[0] === $ruleParts[0];
            if (!$existInDefault) // Not found in default, add
                $combined[] = $ruleParts;
            else // Found in default, override
                $combined[$idx] = $ruleParts;
        }
        return $combined;
    }
}
