<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Sivujetti\App;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

final class GetThemeStylesTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public function testListStylesReturnsListOfThemesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state);
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedThemesStylesFromDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testStyles = [
            (object)["name"=>"textColor","friendlyName"=>"1",
                     "value"=>(object)["type"=>"color","value"=>["ff","00","00","ff"]]],
            (object)["name"=>"headerColor","friendlyName"=>"2",
                     "value"=>(object)["type"=>"color","value"=>["00","ff","00","ff"]]],
        ];
        $state->testThemeId = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function insertTestTheme(\TestState $state): void {
        $state->testThemeId = $this->dbDataHelper->insertData((object) [
            "name" => "get-styles-test-theme",
            "globalStyles" => json_encode($state->testStyles),
        ], "themes");
    }
    private function sendListThemeStylesRequest(\TestState $state): void {
        $app = $this->makeApp(fn() => App::create(self::setGetConfig()));
        $state->spyingResponse = $app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testThemeId}/styles", "GET"));
    }
    private function verifyReturnedThemesStylesFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $actualStyles = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $actualStyles);
        $this->assertEquals("textColor", $actualStyles[0]->name);
        $this->assertEquals("ff0000ff", implode("", $actualStyles[0]->value->value));
        $this->assertEquals("headerColor", $actualStyles[1]->name);
        $this->assertEquals("00ff00ff", implode("", $actualStyles[1]->value->value));
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListStylesReturnsNothingIfThemeDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testThemeId = "999";
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedNothingFromDb($state);
    }
    private function verifyReturnedNothingFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(404, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([], $state->spyingResponse);
    }
}
