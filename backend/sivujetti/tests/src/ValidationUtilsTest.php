<?php declare(strict_types=1);

namespace Sivujetti\Tests;

use PHPUnit\Framework\TestCase;
use Pike\{ObjectValidator, Validation};
use Sivujetti\BlockType\PropertiesBuilder;
use Sivujetti\ValidationUtils;

final class ValidationUtilsTest extends TestCase {
    public function testAddRulesForPropertiesPopulatesValidatorFromUserAndDefaultRules(): void {
        $testProps = (new PropertiesBuilder)
            ->newProperty("longerText")->dataType("text") // dataType "text" has ["maxLength", 1024] by default
            ->newProperty("shorterText")->dataType("text", validationRules: [["maxLength", 256]])
            ->getResult();
        //
        $_ = Validation::makeObjectValidator(); // A hack to trigger autoload of ObjectValidator
        $spying = ValidationUtils::addRulesForProperties($testProps, self::createSpyingObjectValidator());
        //
        $actuallyAddedRules = $spying->calls;
        $this->assertCount(4, $actuallyAddedRules);
        [$_longerTextDt, $longerTextMaxLen, $_shorterTextDt, $shorterTextMaxLen] = $actuallyAddedRules;
        $this->assertEquals(["longerText", "maxLength", 1024], $longerTextMaxLen);
        $this->assertEquals(["shorterText", "maxLength", 256], $shorterTextMaxLen);
    }
    private static function createSpyingObjectValidator(): ObjectValidator {
        return new class extends ObjectValidator {
            public array $calls;
            public function rule(string $propPath, string $ruleName, ...$args): ObjectValidator {
                $this->calls[] = [$propPath, $ruleName, ...$args];
                return parent::rule($propPath, $ruleName, ...$args);
            }
        };
    }
}
