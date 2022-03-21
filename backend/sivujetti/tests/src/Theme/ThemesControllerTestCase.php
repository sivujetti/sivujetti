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
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    protected function createDefaultTestState(): \TestState {
        $state = new \TestState;
        $state->testGlobalStyles = [
            (object)["name"=>"textColor","friendlyName"=>"1",
                     "value"=>(object)["type"=>"color","value"=>["ff","00","00","ff"]]],
            (object)["name"=>"headerColor","friendlyName"=>"2",
                     "value"=>(object)["type"=>"color","value"=>["00","ff","00","ff"]]],
        ];
        $state->testBlockTypeStyles = [
            (object)["styles" => "{ padding: 6rem 3rem; }",
                     "themeId"=>"@filledAfter",
                     "blockTypeName"=>"Section"],
            (object)["styles" => "{ color: #444; }",
                     "themeId"=>"@filledAfter",
                     "blockTypeName"=>"Paragraph"],
        ];
        $state->testThemeId = null;
        $state->spyingResponse = null;
        return $state;
    }
    protected function insertTestTheme(\TestState $state): void {
        $state->testThemeId = $this->dbDataHelper->insertData((object) [
            "name" => "get-styles-test-theme",
            "globalStyles" => json_encode($state->testGlobalStyles),
        ], "themes");
        for ($i = 0; $i < count($state->testBlockTypeStyles); ++$i) {
            $state->testBlockTypeStyles[$i]->themeId = $state->testThemeId;
        }
    }
    protected function insertTestBlockTypeStylesForTestTheme(\TestState $state): void {
        $this->dbDataHelper->insertData($state->testBlockTypeStyles, "themeBlockTypeStyles");
    }
}
