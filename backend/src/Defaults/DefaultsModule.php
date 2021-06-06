<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\AppContext;

final class DefaultsModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('POST', '/api/defaults/contact-form/handle-submit/[i:contactFormBlockId]',
            [DefaultsController::class, 'processFormsBlockFSubmit']
        );
        $ctx->router->map('POST', '/api/defaults/[w:blockType]/render-template/[w:templateName]',
            [DefaultsController::class, 'renderBlockTemplate']
        );
    }
}
