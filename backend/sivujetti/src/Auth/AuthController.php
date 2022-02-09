<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\{PikeException, Request, Response, Validation};
use Pike\Auth\Authenticator;
use Pike\Entities\User;

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
        if (($errors = $this->validateLoginFormInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        try {
            $auth->login($req->body->username, $req->body->password, fn(User $user) => (object) [
                "id" => $user->id,
                "role" => $user->role,
            ]);
            $res->json(["ok" => "ok"]);
        } catch (PikeException $e) {
            if ($e->getCode() === Authenticator::CREDENTIAL_WAS_INVALID ||
                $e->getCode() === Authenticator::ACCOUNT_STATUS_WAS_UNEXPECTED) {
                $res->json(["errorCode" => $e->getCode(), "ok" => "err"]);
                return;
            }
            throw $e;
        }
    }
    /**
     *  POST /api/auth/logout: Logs the user out.
     *
     * @param \Pike\Response $res
     * @param \Pike\Auth\Authenticator $auth
     */
    public function processLogoutAttempt(Response $res,
                                         Authenticator $auth): void {
        $auth->logout();
        $res->json(["ok" => "ok"]);
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateLoginFormInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("username", "minLength", 2)
            ->rule("password", "minLength", 1)
            ->validate($input);
    }
}
