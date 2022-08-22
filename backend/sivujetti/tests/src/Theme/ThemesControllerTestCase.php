<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Pike\Db\FluentDb;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{CssGenTestUtils, DbDataHelper, HttpApiTestTrait};

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
        $state->testStyles = [
            (object)["units" => json_encode([["title"=>"Default","id"=>"default","scss"=>"padding: 6rem 3rem",
                                    "generatedCss"=>".j-Section-default{padding:6rem 3rem;}"]]),
                     "themeId"=>"@filledAfter",
                     "blockTypeName"=>"Section"],
            (object)["units" => json_encode([["title"=>"Default","id"=>"default","scss"=>"color: #444",
                                  "generatedCss"=>".j-Paragraph-default{color:#444;}"]]),
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
                "stylesOrder" => json_encode([]),
                "globalStyles" => json_encode($state->testGlobalStyles),
            ], "themes"),
            "name" => $themeName
        ];
        for ($i = 0; $i < count($state->testStyles); ++$i)
            $state->testStyles[$i]->themeId = $state->testTheme->id;
    }
    protected function insertTestStylesForTestTheme(\TestState $state): void {
        $this->dbDataHelper->insertData($state->testStyles, "themeStyles");
        (new FluentDb(self::$db))->update("\${p}themes")
            ->values((object) ["generatedScopedStylesCss" => CssGenTestUtils::generateScopedStyles($state->testStyles)])
            ->where("id=?", [$state->testTheme->id])
            ->execute();
    }
}
