<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Request;

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
}
