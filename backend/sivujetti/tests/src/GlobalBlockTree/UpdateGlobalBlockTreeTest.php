<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Pike\Interfaces\SessionInterface;
use Pike\PikeException;
use Sivujetti\Auth\ACL;
use Sivujetti\Block\{BlocksController, BlockTree};
use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\{BlockTestUtils, PageTestUtils};

final class UpdateGlobalBlockTreeTest extends GlobalBlockTreesControllerTestCase {
    public function testUpdateGlobalBlockTreeBlocksWritesUpdatedDataToDb(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateGlobalBlockTreeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteNewDataToDb($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        //
        $state->originalData = json_decode(json_encode($state->inputData));
        //
        $state->inputData->name = "My stored tree updated";
        $section = $state->inputData->blocks[0];
        $paragraph = $section->children[0];
        $paragraph->text = "© Year My Site Updated";
        //
        return $state;
    }
    private function sendUpdateGlobalBlockTreeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees/{$state->originalData->id}/blocks",
                "PUT", $state->inputData));
    }
    private function verifyWroteNewDataToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("globalBlocks",
                                              "`id` = ?",
                                              [$state->originalData->id]);
        $this->assertEquals($state->originalData->name, $actual["name"],
            "Shouldn't update name");
        $normalized = BlocksController::makeStorableBlocksDataFromValidInput($state->inputData->blocks,
            PageTestUtils::createTestApiCtx()->blockTypes);
        $this->assertEquals(BlockTree::toJson($normalized),
                            $actual["blocks"]);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateGlobalBlockTreeBlocksCatchesInvalidBlockTypes(): void {
        $state = $this->setupTest();
        $state->inputData->blocks = [(object) ["type" => "not-valid"]];
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendUpdateGlobalBlockTreeRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateGlobalBlockTreeBlocksCatchesInvalidBasicProps(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" => [(object) ["type" => "Paragraph", "id" => "not-valid"]]];
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateGlobalBlockTreeRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "title must be string",
            "The length of title must be 1024 or less",
            "The value of renderer was not in the list",
            "id is not valid push id",
            "text must be string",
            "The length of text must be 1024 or less",
            "cssClass must be string",
            "The length of cssClass must be 1024 or less",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateGlobalBlockTreeBlocksFailsIfUserTriesToUpdateBlockPropWithoutSufficientPermission(): void {
        $state = $this->setupTryToUpdateBlockWithoutSufficientPermissionTest();
        $this->simulateMenuBlocksSensitiveDataChanges($state);
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->createAppUsingThatUsesThisAsLoggedInUserRole(ACL::ROLE_ADMIN_EDITOR, $state);
        $this->sendUpdateGlobalBlockTreeRequest($state);
        $this->verifyResponseMetaEquals(403, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["err" => "Not permitted."], $state->spyingResponse);
    }
    private function setupTryToUpdateBlockWithoutSufficientPermissionTest(): \TestState {
        $state = parent::setupTest();
        $btu = new BlockTestUtils();
        $state->inputData->blocks = [$btu->makeBlockData(Block::TYPE_MENU,
            renderer: "sivujetti:block-menu", propsData: $btu->createMenuBlockData(), id: "@auto")];
        $state->originalData = json_decode(json_encode($state->inputData));
        return $state;
    }
    private function simulateMenuBlocksSensitiveDataChanges(\TestState $state): void {
        $menuBlock = $state->inputData->blocks[0];
        (new BlockTestUtils())->setBlockProp($menuBlock, "itemStart", "<li><img onerror=\"xss\">...");
    }
    private function createAppUsingThatUsesThisAsLoggedInUserRole(int $userRole, \TestState $state): void {
        $this->makeTestSivujettiApp($state, function ($bootModule) use ($userRole) {
            $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                          ":userRole" => $userRole]);
        });
    }
}
