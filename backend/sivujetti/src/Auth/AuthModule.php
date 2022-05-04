<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\{Injector, Request, Response, Router};
use Pike\Auth\Authenticator;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class AuthModule {
    /** @var \Pike\Injector */
    private Injector $di;
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->on("*", function ($req, $res, $next) {
            if (!$this->checkIfUserIsPermittedToAccessThisRoute($req, $res)) return;
            $next();
        });
        $router->map("POST", "/api/auth/login",
            [AuthController::class, "processLoginAttempt", ["consumes" => "application/json",
                                                            "skipAuth" => true]]
        );
        $router->map("POST", "/api/auth/logout",
            [AuthController::class, "processLogoutAttempt", ["consumes" => "application/json",
                                                             "skipAuth" => true]]
        );
    }
    /**
     * @param \Pike\Injector $di
     */
    public function beforeExecCtrl(Injector $di): void {
        $di->share(new ACL(doThrowDevWarnings: (bool) (SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE)));
        $this->di = $di;
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
        $req->myData->user = $this->di->make(Authenticator::class)->getIdentity();
        if (!($userRole = $req->myData->user?->role)) {
            $res->status(401)->plain("Login required");
            return false;
        }
        //
        $acl = $this->di->make(ACL::class);
        $theWebsite = $this->di->make(TheWebsite::class);
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
