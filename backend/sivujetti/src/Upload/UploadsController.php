<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{Request, Response};

final class UploadsController {
    /**
     * GET /api/uploads/:filters?: Returns a list of files synced to db
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Upload\UploadsRepository $uploadsRepo
     */
    public function getUploads(Request $req,
                               Response $res,
                               UploadsRepository $uploadsRepo): void {
        if ($req->params->filters !== '{"mime":{"$eq":"image/*"}}')
            throw new \RuntimeException("Not implemented");
        $files = $uploadsRepo->getMany((new UploadsQFilters)->byMime("image/*"));
        $res->json($files);
    }
}
