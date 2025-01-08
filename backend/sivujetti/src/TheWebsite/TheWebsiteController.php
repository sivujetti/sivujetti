<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use anlutro\cURL\cURL;
use Pike\{Request, Response, Validation};
use Pike\Db\FluentDb2;
use Pike\Interfaces\FileSystemInterface;
use Sivujetti\{AppEnv, JsonUtils, ValidationUtils};
use Sivujetti\Page\{PagesController, WebPageAwareTemplate};
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class TheWebsiteController {
    private const T = "\${p}theWebsite";
    /**
     * PUT /api/the-website/basic-info: Overwrites website's basic info to the
     * database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function saveBasicInfo(Request $req,
                                  Response $res,
                                  FluentDb2 $db2): void {
        if (($errors = $this->validateSaveBasicInfoInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        self::updateTheWebsite((object) [
            "name" => $req->body->name,
            "lang" => $req->body->lang,
            "country" => $req->body->country,
            "description" => $req->body->description,
            "hideFromSearchEngines" => $req->body->hideFromSearchEngines,
        ], $db2);
        //
        $res->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/the-website/global-scripts: Overwrites the html that goes to <head>
     * or to the end of <body> to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function saveGlobalScripts(Request $req,
                                      Response $res,
                                      FluentDb2 $db2): void {
        if (($errors = $this->validateSaveGlobalScriptsInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        self::updateTheWebsite((object) [
            "headHtml" => $req->body->headHtml,
            "footHtml" => $req->body->footHtml,
        ], $db2);
        //
        $res->json(["ok" => "ok"]);
    }
    /**
     * POST /api/the-website/export: exports local database (excluding plugins)
     * to a single json file SIVUJETTI_BACKEND_PATH . "exported.json".
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\TheWebsite\Exporter $exporter
     * @param \Pike\Interfaces\FileSystemInterface $fs
     */
    public function export(Response $res, Exporter $exporter, FileSystemInterface $fs): void {
        $rows = $exporter->export(); // @allow \Pike\PikeException
        $fs->write(SIVUJETTI_BACKEND_PATH . "exported.json", JsonUtils::stringify($rows));
        $res->json(["ok" => "ok"]);
    }
    /**
     * GET /api/the-website/issues: returns security and other issues.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\AppEnv $appEnv
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function getSecurityAndOtherIssues(Request $req, Response $res, AppEnv $appEnv, TheWebsite $theWebsite): void {
        $issues = [];
        $host = PagesController::getServerHost($req); // "http[s]://foo.com"
        $hostNoScheme = parse_url($host, PHP_URL_HOST);
        $isLocalhost = in_array($hostNoScheme, ["localhost", "127.0.0.1", "[::1]", "::1"], true);

        if ($isLocalhost && ini_get("display_errors") === "1" && extension_loaded("xdebug")) {
            $issues[] = (object) ["issue" => "Xdebug is enabled", "detail" => null];
        }

        // If SIVUJETTI_BACKEND_PATH = '/to/htdocs/backend/' and SIVUJETTI_INDEX_PATH === '/to/htdocs/'
        $backendIsInsidePublicDir = dirname(SIVUJETTI_INDEX_PATH . "file.php") === dirname(SIVUJETTI_BACKEND_PATH . "file.php", 2);
        if ($backendIsInsidePublicDir &&
            strlen(self::createFetchFn($host, $appEnv)(substr(SIVUJETTI_BACKEND_PATH, strlen(SIVUJETTI_INDEX_PATH)) . // "/to/htdocs/backend/" -> "backend/"
                                                      "assets/templates/edit-app-wrapper.tmpl.php"))) {
            $issues[] = (object) [
                "issue" => "Backend directory is publicly accessible",
                "detail" => $isLocalhost ? "isFineBecauseLocalhost" : null,
            ];
        }

        if (!$isLocalhost && (
            $theWebsite->hideFromSearchEngines ||
            str_contains(self::createFetchFn($host, $appEnv)("/"), "noindex, nofollow, nosnippet, noarchive")
        )) {
            $issues[] = (object) [
                "issue" => "Website is hidden from search engines",
                "detail" => $theWebsite->hideFromSearchEngines ? null : "isNotHiddenInSettings",
            ];
        }

        if (!str_contains(
            self::createFetchFn($host, $appEnv)("/?in-edit=1"),
            "<script>sivujettiWebPagePreviewRendererApp.mountToDocumentBody(window.__pageDataDebugOnly)</script></body>"
        )) {
            $issues[] = (object) ["issue" => "File conflict detected", "detail" => null];
        }

        $res->json($issues);
    }
    /**
     * @param object $data
     * @param \Pike\Db\FluentDb2 $db2
     */
    private static function updateTheWebsite(object $data, FluentDb2 $db2): void {
        $db2->update(self::T)
            ->values($data)
            ->where("1=1")
            ->execute();
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateSaveBasicInfoInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("name", "minLength", 1)
            ->rule("name", "maxLength", ValidationUtils::INDEX_STR_MAX_LENGTH)
            ->rule("lang", "type", "string")
            ->rule("lang", "regexp", "/^[a-z]{2}$/") // see backend/installer/schema.mysql.php
            ->rule("country", "type", "string")
            ->rule("country", "regexp", "/^[A-Z]{2}$/")
            ->rule("description", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("hideFromSearchEngines", "type", "bool")
            ->validate($input);
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateSaveGlobalScriptsInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("headHtml", "type", "string")
            ->rule("headHtml", "maxLength", ValidationUtils::HARD_LONG_TEXT_MAX_LEN)
            ->rule("footHtml", "type", "string")
            ->rule("footHtml", "maxLength", ValidationUtils::HARD_LONG_TEXT_MAX_LEN)
            ->validate($input);
    }
    /**
     * @param object $serverHost
     * @param \Sivujetti\AppEnv $appEnv
     * @return \Closure
     * @psalm-return \Closure(string):string
     */
    private static function createFetchFn(string $serverHost, AppEnv $appEnv): \Closure {
        static $fetch;
        if (!$fetch) {
            $tmpl = (new WebPageAwareTemplate("", env: $appEnv->constants));
            $fetch = static fn(string $url): string =>
                (new cURL)->get("{$serverHost}{$tmpl->makeUrl($url)}")->getBody()
            ;
        }
        return $fetch;
    }
}
