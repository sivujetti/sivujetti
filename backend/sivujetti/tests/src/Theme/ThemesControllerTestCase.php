<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait};

abstract class ThemesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public static function getDbConfig(): array {
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    protected function createDefaultTestState(): \TestState {
        $state = new \TestState;
        $state->testTheme = null;
        $state->spyingResponse = null;
        return $state;
    }
    protected function insertTestTheme(\TestState $state, string $themeName): void {
        $state->testTheme = (object) [
            "name" => $themeName,
            "styleChunkBundlesAll" => "{\"styleChunks\":[],\"cachedCompiledCss\":\"\"}",
            "cachedCompiledScreenSizesCssHashes" => "",
            "stylesOrder" => json_encode([]),
            "globalStyles" => "{}",
            "generatedScopedStylesCss" => "",
            "generatedScopedStylesCss" => "0",
        ];
        $state->testTheme->id = $this->dbDataHelper->insertData($state->testTheme, "themes");
    }
}
