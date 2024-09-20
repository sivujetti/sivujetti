<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\Block\Entities\Block;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Utils\{BlockTestUtils};
use Pike\{ArrayUtils, PikeException};
use Pike\Interfaces\SessionInterface;
use Sivujetti\Auth\ACL;

final class OverwritePageBlocksTest extends PagesControllerTestCase {
    public function testOverwritePageBlocksSavesNewBlocksAndLastUpdatedAtToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwrotePageBlocksToDb($state);
        $this->verifyOverwroteLastUpdatedAtToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/overwrite-blocks-test-page";
        $state->testPageData->path = "/overwrite-blocks-test-page/";
        $state->testPageData->lastUpdatedAt -= 42;
        $state->inputData = (object) ["blocks" =>
            [$btu->makeBlockData(Block::TYPE_TEXT, propsData: ["html" => "<p>Hello</p>"])]
        ];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendOverwritePageBlocksRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/" . PageType::PAGE . "/{$state->testPageData->id}/blocks",
            "PUT",
            $state->inputData));
    }
    private function verifyOverwrotePageBlocksToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $this->assertCount(1, $actual->blocks);
        $this->assertEmpty($actual->blocks[0]->children);
        $this->assertEquals($state->inputData->blocks[0]->type, $actual->blocks[0]->type);
        $this->assertEquals($state->inputData->blocks[0]->id, $actual->blocks[0]->id);
    }
    private function verifyOverwroteLastUpdatedAtToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $this->assertTrue($actual->lastUpdatedAt > $state->testPageData->lastUpdatedAt);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksPassesSaveAwareBlocksToOnBeforeSaveEvent(): void {
        $state = $this->setupOnBeforeSaveEventsTest();
        $this->makePagesControllerTestApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwrotePageBlocksToDb2($state);
    }
    private function setupOnBeforeSaveEventsTest(): \TestState {
        $state = $this->setupTest();
        $this->registerTestCustomBlockType();
        $state->inputData = (object) ["blocks" =>
            [(new BlockTestUtils())->makeBlockData("Icon",
                propsData: ["iconId" => "check-circle"])]
        ];
        return $state;
    }
    private function verifyOverwrotePageBlocksToDb2(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $this->assertCount(1, $actual->blocks);
        $this->assertEmpty($actual->blocks[0]->children);
        $v = ArrayUtils::findByKey($actual->blocks[0]->propsData, "__alwaysAddedDynamicProp", "key")?->value;
        $this->assertEquals("<svg>1", $v);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksCatchesInvalidBlockTypes(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" => [(object) ["type" => "not-valid"]]];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendOverwritePageBlocksRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksCatchesInvalidBasicProps(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" => [(object) ["type" => "Text", "id" => "not-valid",
            "styleClasses" => ["not-a-string"]]]];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "title must be string",
            "The length of title must be 1024 or less",
            "The value of renderer was not in the list",
            "styleClasses must be string",
            "The length of styleClasses must be 1024 or less",
            "id is not valid push id",
            "html must be string",
            "The length of html must be 128000 or less",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksFailsIfUserTriesToUpdateBlockPropWithoutSufficientPermission(): void {
        $state = $this->setupTryToUpdateBlockWithoutSufficientPermissionTest();
        $this->simulateMenuBlocksSensitiveDataChanges($state);
        $this->createAppUsingThatUsesThisAsLoggedInUserRole(ACL::ROLE_EDITOR, $state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyResponseMetaEquals(403, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["err" => "Not permitted."], $state->spyingResponse);
    }
    private function setupTryToUpdateBlockWithoutSufficientPermissionTest(): \TestState {
        $state = $this->setupTest();
        $btu = new BlockTestUtils();
        $state->testPageData->blocks[0]->children = [$btu->makeBlockData(Block::TYPE_CODE,
            propsData: (object) ["code" => "<script>test"], id: "@auto")];
        return $state;
    }
    private function simulateMenuBlocksSensitiveDataChanges(\TestState $state): void {
        $cloneAll = json_decode(json_encode($state->testPageData->blocks));
        $cloneMenu = $cloneAll[0]->children[0];
        (new BlockTestUtils())->setBlockProp($cloneMenu, "code", "<script>updated");
        $state->inputData = (object) ["blocks" => $cloneAll];
    }
    private function createAppUsingThatUsesThisAsLoggedInUserRole(int $userRole, \TestState $state): void {
        $this->makeTestSivujettiApp($state, function ($bootModule) use ($userRole) {
            $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                          ":userRole" => $userRole]);
        });
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksRejectsIfPageDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testPageData->id = "4040";
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->sendOverwritePageBlocksRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksUsesUserDefinedJsonPropSanitizer(): void {
        $state = $this->setupOverwriteProcUsesSanitizerTest();
        $this->makePagesControllerTestApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifySavedBlockFromDbIsSanitized($state);
    }
    private function setupOverwriteProcUsesSanitizerTest(): \TestState {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" =>
            [(new BlockTestUtils())->makeBlockData(type: Block::TYPE_MENU, propsData: [
                "tree" => [
                    (object) ["id" => "", "slug" => "/", "text" => "", "children" => [], "junk" => "data"]
                ]
            ])]
        ];
        return $state;
    }
    private function verifySavedBlockFromDbIsSanitized(\TestState $state): void {
        $page = $this->pageTestUtils->getPageById($state->testPageData->id);
        $this->assertCount(1, $page->blocks);
        $actual = $page->blocks[0];
        //
        $actualFromRoot = $actual->tree[0];
        $this->assertObjectNotHasProperty("junk", $actualFromRoot);
        //
        $actualFromPropsDataArr = $actual->propsData[0]->value[0];
        $this->assertObjectNotHasProperty("junk", $actualFromPropsDataArr);
    }
}
