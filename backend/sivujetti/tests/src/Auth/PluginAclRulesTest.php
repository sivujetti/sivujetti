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
        // ACL::ROLE_EDITOR
        $this->sendSomethingRequest($state, ACL::ROLE_EDITOR, "getSomething");
        $this->assertEquals(403, $state->spyingResponse->getActualStatusCode());
        $this->sendSomethingRequest($state, ACL::ROLE_EDITOR, "updateSomething");
        $this->assertEquals(403, $state->spyingResponse->getActualStatusCode());
        // ACL::ROLE_ADMIN_EDITOR
        $this->sendSomethingRequest($state, ACL::ROLE_ADMIN_EDITOR, "getSomething");
        $this->assertEquals(200, $state->spyingResponse->getActualStatusCode());
        $this->sendSomethingRequest($state, ACL::ROLE_ADMIN_EDITOR, "updateSomething");
        $this->assertEquals(403, $state->spyingResponse->getActualStatusCode());
        //
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
    private function sendSomethingRequest(\TestState $state, int $userRole, string $route): void {
        $this->makeTestSivujettiApp($state, function ($bootModule) use ($userRole) {
            $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                          ":userRole" => $userRole]);
        });
        $state->spyingResponse = $state->app->sendRequest($route === "getSomething"
            ? $this->createApiRequest(MyPrefixPluginName::$testRoute1Url, method: "GET")
            : $this->createApiRequest(MyPrefixPluginName::$testRoute2Url, method: "PUT", body: (object)["dym" => "my"])
        );
    }
    private function resetTestPluginInstructions(): void {
        MyPrefixPluginName::$testInstructions = "";
    }
}
