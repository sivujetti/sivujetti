<?php declare(strict_types=1);

namespace Sivujetti\Update;

use anlutro\cURL\cURL;

final class CurlHttpClient implements HttpClientInterface {
    /**
     * @inheritdoc
     */
    public function get(string $url, ?array $headers = null): HttpClientResp {
        $req = (new cURL)->newRequest("get", $url);
        if ($headers) {
            foreach ($headers as $key => $val)
                $req->setHeader($key, $val);
        }
        $resp = $req->send();

        $respOut = new HttpClientResp;
        $respOut->status = $resp->statusCode;
        $respOut->data = $resp->body ?: "";
        $respOut->headers = $resp->headers;
        return $respOut;
    }
    /**
     * @inheritdoc
     */
    public function downloadFileToDisk(string $url, string &$targetLocalFilePath, ?array $headers = null): HttpClientResp {
        if (!$targetLocalFilePath) {
            $fileName = self::getFileNameOf($url); // https://domain.com/file.zip?no-cache=1 -> file.zip
            $targetLocalFilePath = SIVUJETTI_BACKEND_PATH . $fileName;
        }

        $ch = \curl_init();
        \curl_setopt($ch, CURLOPT_URL, $url);
        //
        $fp = \fopen($targetLocalFilePath, "w");
        \curl_setopt($ch, CURLOPT_FILE, $fp);
        //
        $response = \curl_exec($ch);
        \curl_close($ch);
        \fclose($fp);

        $respOut = new HttpClientResp;
        $respOut->status = $response && \is_file($targetLocalFilePath) ? 200 : 500;
        $respOut->data = "";
        $respOut->headers = [];

        return $respOut;
    }
    /**
     * @param string $url
     * @return string
     */
    private static function getFileNameOf(string $url): string {
        throw new \RuntimeException("Not implemeted yet.");
    }
}
