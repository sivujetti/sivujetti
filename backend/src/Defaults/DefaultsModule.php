<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\AppContext;

final class DefaultsModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('POST', '/api/defaults/contact-form/handle-submit/[w:contactFormBlockId]',
            [DefaultsController::class, 'processFormsBlockFSubmit']
        );
        $todoReplaceWithRegexp = '*';
        $ctx->router->map('POST', '/api/defaults/[w:blockType]/render-template/['.$todoReplaceWithRegexp.':templateName]',
            [DefaultsController::class, 'renderBlockTemplate']
        );
    }
}
