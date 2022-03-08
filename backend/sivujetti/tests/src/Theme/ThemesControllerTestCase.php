<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

abstract class ThemesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    protected function createDefaultTestState(): \TestState {
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
    protected function insertTestTheme(\TestState $state): void {
        $state->testThemeId = $this->dbDataHelper->insertData((object) [
            "name" => "get-styles-test-theme",
            "globalStyles" => json_encode($state->testStyles),
        ], "themes");
    }
}
