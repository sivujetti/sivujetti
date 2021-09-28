<?php declare(strict_types=1);

namespace Sivujetti\Update;

final class CurlHttpClient implements HttpClientInterface {
    public function get(string $url, ?array $headers = null): HttpClientResp {
        throw new \RuntimeException();
    }
    public function downloadFileToDisk(string $url, string &$targetLocalFilePath, ?array $headers = null): HttpClientResp {
        throw new \RuntimeException();
    }
}