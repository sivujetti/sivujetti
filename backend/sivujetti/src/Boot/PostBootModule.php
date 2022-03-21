<?php declare(strict_types=1);

namespace Sivujetti\Boot;

use Pike\{Injector, Router};
use Sivujetti\SharedAPIContext;
use Sivujetti\UserSite\UserSiteAPI;

final class PostBootModule {
    /**
     * @param \Pike\Router $_router
     */
    public function init(Router $_router): void {
        //
    }
    /**
     * @param \Pike\Injector $di
     */
    public function beforeExecCtrl(Injector $di): void {
        $apiCtx = $di->make(SharedAPIContext::class);
        $apiCtx->setAppPhase(SharedAPIContext::PHASE_READY_TO_EXECUTE_ROUTE_CONTROLLER);
        $apiCtx->triggerEvent(UserSiteAPI::ON_ROUTE_CONTROLLER_BEFORE_EXEC);
    }
}

