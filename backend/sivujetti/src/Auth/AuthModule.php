<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\{Injector, PikeException, Request, Response, Router};
use Pike\Auth\Authenticator;
use Sivujetti\{SharedAPIContext};
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
        $di->share($this->createEmptyAcl());
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
        $ctx = $req->routeInfo->myCtx;
        // Route explicitly marked as public / not protected -> do nothing
        if (($ctx["skipAuth"] ?? null) === true) {
            return true;
        }

        $loadLazilyAndReturnEarly = ($ctx["skipAuthButLoadRequestUser"] ?? null) === true;
        // Load the user normally
        if (!$loadLazilyAndReturnEarly)
            $req->myData->user = $this->di->make(Authenticator::class)->getIdentity();
        // Load the user only if session has been started already
        else {
            $sessionExists = strlen($req->cookie("PHPSESSID", "")) > 16;
            $req->myData->user = !$sessionExists
                ? null
                : $this->di->make(Authenticator::class)->getIdentity();
        }

        if ($loadLazilyAndReturnEarly) {
            return true;
        }

        // User not found from the session nor the rememberMe data
        if (!($userRole = $req->myData->user?->role)) {
            $res->status(401)->plain("Login required");
            return false;
        }
        //
        $aclInfo = $ctx["identifiedBy"];
        [$rules, $isPlugin] = $this->getAclRulesFor($aclInfo);
        $acl = !$isPlugin ? $this->di->make(ACL::class) : $this->createEmptyAcl();
        $acl->setRules($rules);
        // User not permitted to access this route
        if (!$acl->can($userRole, ...$aclInfo)) {
            $res->status(403)->plain("Not permitted");
            return false;
        }
        // User was permitted to access this route
        return true;
    }
    /**
     * @param array{0: string, 1: string} $identifiedBy [$aclActionName, $aclResourceName]
     * @return array{0: object, 1: bool} [$rules, $isIdentifiedByDefinedByPlugin]
     * @throws \Pike\PikeException
     */
    public function getAclRulesFor(array $identifiedBy): array {
        $aclRes = $identifiedBy[1];
        // Normal api-request
        if (!str_starts_with($aclRes, "plugins/")) {
            $theWebsite = $this->di->make(TheWebsite::class);
            return [json_decode($theWebsite->aclRulesJson, flags: JSON_THROW_ON_ERROR), false];
        }
        // Request handled by a plugin
        $ns = explode(":", $aclRes)[0]; // "plugins/JetForms:resourceName" -> "plugins/JetForms"
        $pluginName = substr($ns, strlen("plugins/")); // "plugins/JetForms" -> "JetForms"
        if (!($plugin = $this->di->make(SharedAPIContext::class)->userPlugins[$pluginName] ?? null))
            throw new PikeException("Sanity", PikeException::BAD_INPUT);
        if (!method_exists($plugin, "defineAclRules"))
            throw new PikeException("", PikeException::BAD_INPUT);
        //
        $builder = $plugin->defineAclRules(new ACLRulesBuilder("{$ns}:"));
        $rules = $builder->toObject();
        return [$rules, true];
    }
    /**
     * @return \Sivujetti\Auth\ACL
     */
    private function createEmptyAcl(): ACL {
        return new ACL(doThrowDevWarnings: (bool) (SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE));
    }
}
