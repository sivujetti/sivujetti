<?php declare(strict_types=1);

namespace Sivujetti\Tests\Auth;

use Sivujetti\Tests\Utils\{HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

abstract class AuthControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
}
