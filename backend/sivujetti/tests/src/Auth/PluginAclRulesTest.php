<?php declare(strict_types=1);

namespace Sivujetti\Tests\Auth;

use Pike\Interfaces\SessionInterface;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use SitePlugins\MyPrefixPluginName\MyPrefixPluginName;
use Sivujetti\Auth\ACL;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait};

final class PluginAclRulesTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    public function testPluginCanDefineAclRulesForHttpRoute(): void {
        $state = $this->setupTest();
        $this->insertTestPluginToDb();
        $this->instructTestPluginToDefineAclRulesForTestRouteDuringNextRequest();
        $this->sendGetSomethingRequest($state);
        $this->verifyResponseMetaEquals(403, "text/plain", $state->spyingResponse);
        $this->resetTestPluginInstructions();
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        return $state;
    }
    private function insertTestPluginToDb(): void {
        $this->dbDataHelper->insertData((object) ["name" => "MyPrefixPluginName", "isActive" => true], "plugins");
    }
    private function instructTestPluginToDefineAclRulesForTestRouteDuringNextRequest(): void {
        MyPrefixPluginName::$testInstructions = "setTestRoutePermissions";
    }
    private function sendGetSomethingRequest(\TestState $state): void {
        $this->makeTestSivujettiApp($state, function ($bootModule) {
            $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                          ":userRole" => ACL::ROLE_EDITOR]);
        });
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest(MyPrefixPluginName::$testRoute1Url, "GET"));
    }
    private function resetTestPluginInstructions(): void {
        MyPrefixPluginName::$testInstructions = "";
    }
}
