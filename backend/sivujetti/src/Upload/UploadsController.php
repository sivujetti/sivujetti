<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{Response};

final class UploadsController {
    /**
     * GET /api/uploads/:filters?: Returns a list of files synced to db
     *
     * @param \Pike\Response $res
     */
    public function getUploads(Response $res): void {
        $res->json([
            (object) [
                "fileName" => "sample.jpg",
                "baseDir" => "",
                "mime" => "image/png",
                "friendlyName" => "",
                "createdAt" => time(),
                "updatedAt" => 0,
            ],
        ]);
    }
}