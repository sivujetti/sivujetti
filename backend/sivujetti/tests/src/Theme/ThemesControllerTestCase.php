<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Pike\Db\FluentDb;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{CssGenTestUtils, DbDataHelper, HttpApiTestTrait};
use Sivujetti\Theme\{CssGenCache, ThemeCssFileUpdaterWriter as CssGen};

abstract class ThemesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected DbDataHelper $dbDataHelper;
    protected CssGenCache $cssGenCache;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
        $this->cssGenCache = new CssGenCache(new FluentDb(self::$db));
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
        $state->testTheme = null;
        $state->spyingResponse = null;
        return $state;
    }
    protected function insertTestTheme(\TestState $state, string $themeName): void {
        $state->testTheme = (object) [
            "id" => $this->dbDataHelper->insertData((object) [
                "name" => $themeName,
                "globalStyles" => json_encode($state->testGlobalStyles),
            ], "themes"),
            "name" => $themeName
        ];
        for ($i = 0; $i < count($state->testBlockTypeStyles); ++$i) {
            $state->testBlockTypeStyles[$i]->themeId = $state->testTheme->id;
        }
    }
    protected function insertTestBlockTypeStylesForTestTheme(\TestState $state): void {
        $this->dbDataHelper->insertData($state->testBlockTypeStyles, "themeBlockTypeStyles");
        $this->cssGenCache->updateBlockTypeBaseCss(
            CssGenTestUtils::generateCachedBlockTypeBaseStyles($state->testBlockTypeStyles),
            $state->testTheme->name);
    }
}
