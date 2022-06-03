<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{ObjectValidator, PikeException};

abstract class ValidationUtils {
    public const HARD_SHORT_TEXT_MAX_LEN = 1024;
    public const HARD_LONG_TEXT_MAX_LEN = 128000;
    public const HARD_JSON_TEXT_MAX_LEN = 256000;
    public const EMAIL_REGEXP_SIMPLE = "/^.+@.+$/";
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

                $completed = str_starts_with($noWhitespace, "http://") ||
                    str_starts_with($noWhitespace, "https://") ? $noWhitespace : "https://{$noWhitespace}";

                if (($parts = parse_url($completed)) === false)
                    return false;

                // If present, can contain anything except `//` and `./`
                if (is_string($parts["path"] ?? null) && (
                    str_contains($parts["path"], "./") ||
                    str_contains($noWhitespace, "//")
                )) return false;
            }

            return true;
        }, "%s is not valid"];
    }
    /**
     * @param array<int, object>|\ArrayObject $properties pageType->ownFields or $blockType->defineProperties()
     * @param \Pike\ObjectValidator $to
     * @return \Pike\ObjectValidator
     */
    public static function addRulesForProperties(array|\ArrayObject $properties,
                                                 ObjectValidator $to): ObjectValidator {
        foreach ($properties as $prop) {
            $dt = $prop->dataType;
            $rules = [
                "text"         => [["", "type", "string"], ["", "maxLength", self::HARD_SHORT_TEXT_MAX_LEN]],
                "json"         => [["", "type", "string"], ["", "maxLength", self::HARD_JSON_TEXT_MAX_LEN]],
                "many-to-many" => [["", "type", "array"],  ["%s.*", "type", "number"]],
                "int"          => [["", "type", "number"]],
                "uint"         => [["", "type", "number"], ["", "min", 0]],
            ][$dt->type] ?? null;
            if (!$rules)
                throw new \RuntimeException("Shouldn't happen");
            $userRules = $dt->validationRules ?? [];
            if ($userRules) { // e.g. [ ["", "required"], ["%s.foo", "min", 4] ]
                foreach ($userRules as $ruleParts) {
                    if (!is_array($ruleParts) ||
                        !is_string($ruleParts[0]) ||
                        !in_array($ruleParts[1], self::VALID_RULES, true))
                        throw new PikeException("Invalid validation rule",
                                                PikeException::BAD_INPUT);
                }
                $rules = array_merge($rules, $userRules);
            }
            foreach ($rules as $parts) {
                $pathTmpl = array_shift($parts);
                $propPath = (!$pathTmpl ? $prop->name : sprintf($pathTmpl, $prop->name)) .
                            (!$dt->isNullable ? "" : "?");
                $to->rule($propPath, ...$parts);
            }
        }
        return $to;
    }
}
