<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\Block\BlockValidator;
use Sivujetti\Block\Entities\Block;
use Sivujetti\UserSite\UserSiteAPI;
use PHPUnit\Framework\TestCase;
use Sivujetti\Tests\Utils\PageTestUtils;

final class BlockValidatorTest extends TestCase {
    public function testValidateInsertOrUpdateDataRejectsUnkownRenderers(): void {
        $state = $this->setupTest();
        //
        $state->inputData->renderer = "sivujetti:block-auto";
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals([], $state);
        //
        $state->inputData->renderer = "my-file";
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals(["The value of renderer was not in the list"], $state);
        //
        $this->registerAdditionalRenderer("my-file", $state);
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals([], $state);
        $state->inputData->renderer = "site:my-file";
        $this->invokeValidation($state);
        $this->verifyResultErrorsEquals([], $state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) [
            "title" => "",
            "renderer" => null,
            "id" => "aaaaaaaaaaaaaaaaaaaa",
            "text" => "Some text",
            "cssClass" => "foo",
        ];
        $state->validationErrors = null;
        $state->apiCtx = PageTestUtils::createSharedAPIContext();
        $state->apiCtx->validBlockRenderers = [["fileId" => "sivujetti:block-auto",
                                                "friendlyName" => null,
                                                "associatedWith" => null]];
        return $state;
    }
    private function invokeValidation(\TestState $state): void {
        $v = new BlockValidator($state->apiCtx);
        $state->validationErrors = $v->validateInsertOrUpdateData(Block::TYPE_PARAGRAPH, $state->inputData);
    }
    private function registerAdditionalRenderer(string $fileId, \TestState $state): void {
        $userSiteApi = new UserSiteAPI("site", $state->apiCtx);
        $userSiteApi->registerBlockRenderer($fileId);
    }
    private function verifyResultErrorsEquals(array $expectedErrors, \TestState $state): void {
        $this->assertEquals($expectedErrors, $state->validationErrors);
    }
}
