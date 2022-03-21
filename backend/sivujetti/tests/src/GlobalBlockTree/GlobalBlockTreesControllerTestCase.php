<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\{BlockTestUtils, DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

abstract class GlobalBlockTreesControllerTestCase extends DbTestCase {
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
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->inputData = (object) [
            "name" => "My footer",
            "blocks" => [$btu->makeBlockData(Block::TYPE_SECTION, "Footer", "sivujetti:block-generic-wrapper", children: [
                $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "© Year My Site", "cssClass" => ""]),
            ], propsData: ["bgImage" => "", "cssClass" => ""])]
        ];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
}
