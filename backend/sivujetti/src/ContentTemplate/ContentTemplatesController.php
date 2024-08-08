<?php declare(strict_types=1);

namespace Sivujetti\ContentTemplate;

use Pike\{Response};
use Pike\Db\FluentDb2;
use Sivujetti\{JsonUtils};

final class ContentTemplatesController {
    private const T = "\${p}contentTemplates";
    /**
     * GET /api/content-templates.
     *
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db
     */
    public function list(Response $res, FluentDb2 $db): void {
        $entities = $db->select(self::T)
            ->fields(["id", "blockBlueprints", "title", "previewImgSrc", "category"])
            ->limit(80)
            ->fetchAll(fn(string $id, string $blueprints, string $title, string $imgSrc, string $cat) => (object) [
                "id" => $id,
                "blockBlueprints" => JsonUtils::parse($blueprints),
                "title" => $title,
                "previewImgSrc" => $imgSrc,
                "category" => $cat,
            ]);
        $res->json($entities);
    }
}
