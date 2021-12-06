<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\{Request, Response};
use Pike\Auth\Authenticator;

final class AuthController {
    /**
     *  POST /api/auth/login: Handles requests sent from the login page.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Auth\Authenticator $auth
     */
    public function processLoginAttempt(Request $req,
                                        Response $res,
                                        Authenticator $auth): void {
        $res->plain("todo");
    }
}
