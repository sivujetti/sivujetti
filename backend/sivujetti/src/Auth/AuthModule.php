<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\{Request, Response};
use Sivujetti\AppContext;
use Sivujetti\Auth\ACL;

final class AuthModule {
    /** @var \Sivujetti\AppContext */
    private AppContext $ctx;
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $this->ctx = $ctx;
        $ctx->router->on("*", function ($req, $res, $next) {
            if (!$this->checkIfUserIsPermittedToAccessThisRoute($req, $res)) return;
            $next();
        });
        $ctx->router->map("POST", "/api/auth/login",
            [AuthController::class, "processLoginAttempt", ["skipAuth" => true]]
        );
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @return bool $requestUserIsPermittedToAccessThisRoute
     * @throws \Pike\PikeException If the database returned invalid aclRulesJson
     */
    private function checkIfUserIsPermittedToAccessThisRoute(Request $req,
                                                             Response $res): bool {
        // Route explicitly marked as public / not protected -> do nothing
        if (($req->routeInfo->myCtx["skipAuth"] ?? null) === true) {
            return true;
        }
        // User not found from the session nor the rememberMe data
        $req->myData->user = $this->ctx->auth->getIdentity();
        if (!($userRole = $req->myData->user?->role)) {
            $res->status(401)->plain("Login required");
            return false;
        }
        //
        $acl = new ACL(doThrowDevWarnings: (bool) (SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE));
        $theWebsite = $this->ctx->theWebsite;
        $acl->setRules(json_decode($theWebsite->aclRulesJson, flags: JSON_THROW_ON_ERROR));
        // User not permitted to access this route
        if (!$acl->can($userRole, ...$req->routeInfo->myCtx["identifiedBy"])) {
            $res->status(403)->plain("Not permitted");
            return false;
        }
        // User was permitted to access this route
        return true;
    }
}
