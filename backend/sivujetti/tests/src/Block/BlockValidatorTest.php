<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\Block\BlockValidator;
use Sivujetti\Block\Entities\Block;
use Sivujetti\SharedAPIContext;
use Sivujetti\UserSite\UserSiteAPI;
use PHPUnit\Framework\TestCase;
use Sivujetti\BlockType\ParagraphBlockType;

final class BlockValidatorTest extends TestCase {
    public function testValidateInsertOrUpdateDataRejectsUnkownRenderers(): void {
        $state = $this->setupTest();
        //
        $state->testInput->renderer = "sivujetti:block-auto";
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals([], $state);
        //
        $state->testInput->renderer = "my-file";
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals(["The value of renderer was not in the list"], $state);
        //
        $this->registerAdditionalRenderer("my-file", $state);
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals([], $state);
        $state->testInput->renderer = "site:my-file";
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals([], $state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testInput = (object) [
            "title" => "",
            "renderer" => null,
            "id" => "aaaaaaaaaaaaaaaaaaaa",
            "text" => "Some text",
            "cssClass" => "foo",
        ];
        $state->validationErrors = null;
        $state->sharedAPIContext = new SharedAPIContext;
        $state->sharedAPIContext->getDataHandle()->blockTypes = (object) [
            Block::TYPE_PARAGRAPH => new ParagraphBlockType,
        ];
        $state->sharedAPIContext->getDataHandle()->validBlockRenderers = ["sivujetti:block-auto"];
        return $state;
    }
    private function invokeValidation(\TestState $state): void {
        $v = new BlockValidator($state->sharedAPIContext);
        $state->validationErrors = $v->validateInsertOrUpdateData(Block::TYPE_PARAGRAPH, $state->testInput);
    }
    private function registerAdditionalRenderer(string $fileId, \TestState $state): void {
        $userSiteApi = new UserSiteAPI("site", $state->sharedAPIContext);
        $userSiteApi->registerBlockRenderer($fileId);
    }
    private function verifyResultErrorsEquals(array $expectedErrors, \TestState $state): void {
        $this->assertEquals($expectedErrors, $state->validationErrors);
    }
}
