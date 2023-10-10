<?php declare(strict_types=1);

namespace Sivujetti\Update;

interface HttpClientInterface {
    public function get(string $url, ?array $headers = null): HttpClientResp;
    public function downloadFileToDisk(string $url, string &$targetLocalFilePath, ?array $headers = null): HttpClientResp;
}

final class HttpClientResp {
    /** @var int */
    public int $status;
    /** @var string */
    public string $data;
    /** @var array<string, mixed> */
    public array $headers;
}
