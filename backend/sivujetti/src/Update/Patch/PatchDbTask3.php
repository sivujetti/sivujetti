<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\Auth\Crypto;
use Pike\Db\FluentDb2;
use Sivujetti\JsonUtils;
use Sivujetti\Update\UpdateProcessTaskInterface;

final class PatchDbTask3 implements UpdateProcessTaskInterface {
    /** @var bool */
    private bool $doSkip;
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db;
    /** @var \Pike\Auth\Crypto */
    private Crypto $crypto;
    /**
     * @param string $toVersion
     * @param string $currentVersion
     * @param \Pike\Db\FluentDb2 $db
     * @param \Pike\Auth\Crypto $crypto
     */
    function __construct(string $toVersion,
                         string $currentVersion,
                         FluentDb2 $db,
                         Crypto $crypto) {
        $this->doSkip = !($toVersion === "0.17.0" && $currentVersion === "0.16.0");
        $this->db = $db;
        $this->crypto = $crypto;
    }
    /**
     */
    public function exec(): void {
        if ($this->doSkip) return;

        $this->patchTheWebsite();
    }
    /**
     */
    public function rollBack(): void {
        // Can't rollBack
    }
    /**
     */
    private function patchTheWebsite(): void {
        $fn = require SIVUJETTI_BACKEND_PATH . "installer/default-acl-rules.php";
        $aclRules = $fn();
        $this->db->update("\${p}theWebsite")
            ->values((object) [
                "aclRules" => JsonUtils::stringify($aclRules),
                "versionId" => $this->crypto->genRandomToken(4),
            ])
            ->where("1=1")
            ->execute();
    }
}
