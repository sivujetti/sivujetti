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
        $actual = $this->dbDataHelper->getRow("globalBlockTrees",
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
        $state->inputData = (object) ["blocks" => [(object) ["type" => "Text", "id" => "not-valid",
            "styleClasses" => ["not-a-string"]]]];
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateGlobalBlockTreeRequest($state);
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


    public function testUpdateGlobalBlockTreeBlocksFailsIfUserTriesToUpdateBlockPropWithoutSufficientPermission(): void {
        $state = $this->setupTryToUpdateBlockWithoutSufficientPermissionTest();
        $this->simulateMenuBlocksSensitiveDataChanges($state);
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->createAppUsingThatUsesThisAsLoggedInUserRole(ACL::ROLE_EDITOR, $state);
        $this->sendUpdateGlobalBlockTreeRequest($state);
        $this->verifyResponseMetaEquals(403, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["err" => "Not permitted."], $state->spyingResponse);
    }
    private function setupTryToUpdateBlockWithoutSufficientPermissionTest(): \TestState {
        $state = parent::setupTest();
        $btu = new BlockTestUtils();
        $state->inputData->blocks = [$btu->makeBlockData(Block::TYPE_CODE,
            propsData: (object) ["code" => "<script>test"], id: "@auto")];
        $state->originalData = json_decode(json_encode($state->inputData));
        return $state;
    }
    private function simulateMenuBlocksSensitiveDataChanges(\TestState $state): void {
        $buttonBlock = $state->inputData->blocks[0];
        (new BlockTestUtils())->setBlockProp($buttonBlock, "code", "<script>updated");
    }
    private function createAppUsingThatUsesThisAsLoggedInUserRole(int $userRole, \TestState $state): void {
        $this->makeTestSivujettiApp($state, function ($bootModule) use ($userRole) {
            $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                          ":userRole" => $userRole]);
        });
    }
}
