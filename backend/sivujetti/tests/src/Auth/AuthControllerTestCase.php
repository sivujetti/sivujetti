<?php declare(strict_types=1);

namespace Sivujetti\Tests\Auth;

use Sivujetti\App;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

abstract class AuthControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    protected function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
}
