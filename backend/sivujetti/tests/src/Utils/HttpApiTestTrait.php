<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Interfaces\SessionInterface;
use Pike\Request;
use Sivujetti\App;

trait HttpApiTestTrait {
    /**
     * @see \Pike\Request::__construct
     */
    public function createApiRequest(string $path,
                                     string $method = 'GET',
                                     ?object $body = null,
                                     ?object $files = null,
                                     ?array $serverVars = null,
                                     ?array $queryVars = null,
                                     ?array $cookies = null): Request {
        return new Request($path, $method, $body, $files,
            array_merge(['HTTP_X_REQUESTED_WITH' => 'js-fetch',
                         'CONTENT_TYPE' => 'application/json'],
                        $serverVars ?? []), $queryVars, $cookies);
    }
    /**
     * @param \TestState $state
     * @param \Closure ...$bootModuleAltererFns
     */
    public function makeTestSivujettiApp(\TestState $state, \Closure ...$bootModuleAltererFns): void {
        $bootModule = (new TestEnvBootstrapper(require TEST_CONFIG_FILE_PATH, self::$db));
        $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class)]);
        foreach ($bootModuleAltererFns as $arg) {
            $arg($bootModule);
        }
        $state->app = $this->buildApp(new App($bootModule));
    }
}
