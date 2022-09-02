<?php declare(strict_types=1);

namespace Sivujetti\Tests\ReusableBranch;

use Sivujetti\Tests\Utils\{BlockTestUtils, DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\JsonUtils;

abstract class ReusableBranchesControllerTestCase extends DbTestCase {
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
        $state->spyingResponse = null;
        $btu = new BlockTestUtils();
        $state->testReusableBranch = (object) [
            "id" => "-cccccccccccccccccc1",
            "blockBlueprints" => JsonUtils::stringify([self::blockToBlueprint($btu->makeBlockData("Section", "Header",
            children: [$btu->makeBlockData("Header", propsData: (object) ["level" => 1, "text" => "Hello"])]))])
        ];
        $state->app = null;
        return $state;
    }
    protected function insertTestReusableBranchToDb(object $reusableBranch): void {
        $this->dbDataHelper->insertData($reusableBranch, "reusableBranches");
    }
    protected static function blockToBlueprint(object $block, int $depth = 0): object {
        return (object) [
            "blockType" => $block->type,
            "initialOwnData" => self::propsToObj($block->propsData),
            "initialDefaultsData" => (object) [
                "title" => $block->title ?? null,
                "renderer" => $block->renderer,
                "styleClasses" => $block->styleClasses ?? "",
            ],
            "initialChildren" => $depth === 0
                ? array_map(fn($w) => self::blockToBlueprint($w, $depth + 1), $block->children)
                : [],
        ];
    }
    private static function propsToObj(array $propsData): object {
        $out = new \stdClass;
        foreach ($propsData as $field) {
            $out->{$field->key} = $field->value;
        }
        return $out;
    }
}
