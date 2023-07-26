<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\Auth\Crypto;
use Pike\Db\FluentDb;
use Sivujetti\JsonUtils;
use Sivujetti\Update\UpdateProcessTaskInterface;

final class PatchDbTask2 implements UpdateProcessTaskInterface {
    /** @var bool */
    private bool $doSkip;
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /** @var \Pike\Auth\Crypto */
    private Crypto $crypto;
    /** @var \Closure */
    private \Closure $logFn;
    /**
     * @param string $toVersion
     * @param string $currentVersion
     * @param \Pike\Db\FluentDb $db
     * @param \Pike\Auth\Crypto $crypto
     */
    function __construct(string $toVersion, string $currentVersion, FluentDb $db, Crypto $crypto) {
        $this->doSkip = !($toVersion === "0.15.0" && $currentVersion === "0.14.0");
        $this->db = $db;
        $this->crypto = $crypto;
        $this->logFn = function ($str) { /**/ };
    }
    /**
     */
    public function exec(): void {
        if ($this->doSkip) return;

        $this->patchTheWebsite();
        $this->patchThemeStyles();
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
    /**
     */
    private function patchThemeStyles(): void {
        $styles = $this->db->select("\${p}themeStyles", "stdClass")
            ->fields(["units as unitsJson", "themeId", "blockTypeName"])->fetchAll();
        //
        foreach ($styles as $style) {
            $bef = $style->unitsJson;
            $patched = JsonUtils::parse($bef);
            foreach ($patched as $style2) {
                if (!is_bool($style2->isDerivable ?? null))
                    $style2->isDerivable = false; // Note: mutates $patched
                if (!property_exists($style2, "derivedFrom"))
                    $style2->derivedFrom = null; // Note: mutates $patched
            }
            $style->unitsJson = JsonUtils::stringify($patched);
            if ($style->unitsJson !== $bef) {
                $numRows = $this->db->update("\${p}themeStyles")
                    ->values((object)["units" => $style->unitsJson])
                    ->where("themeid = ? AND blockTypeName=?", [$style->themeId, $style->blockTypeName])
                    ->execute();
                $this->logFn->__invoke("updated themeStyles `{$style->themeId}:{$style->blockTypeName}`: {$numRows} rows changed");
            }
        }
    }
}
