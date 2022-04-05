<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\FluentDb;

final class CssGenCache {
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /**
     * @param \Pike\Db\FluentDb $db
     */
    public function __construct(FluentDb $db) {
        $this->db = $db;
    }
    /**
     * @param string $generatedThemeBlockTypeCss
     * @param string $themeName
     * @return int $numAffectedRows
     */
    public function updateBlockTypeBaseCss(string $generatedThemeBlockTypeCss,
                                           string $themeName): int {
        return $this->updateCachedCss((object) ["generatedBlockTypeBaseCss" => $generatedThemeBlockTypeCss],
                                      $themeName);
    }
    /**
     * @param string $generatedBlockCss
     * @param string $themeName
     * @return int $numAffectedRows
     */
    public function updateBlocksCss(string $generatedBlockCss,
                                    string $themeName): int {
        return $this->updateCachedCss((object) ["generatedBlockCss" => $generatedBlockCss],
                                      $themeName);
    }
    /**
     * @param object $data
     * @param string $themeName
     * @return int $numAffectedRows
     */
    private function updateCachedCss(object $data, string $themeName): int {
        return $this->db->update("\${p}themes")
            ->values($data)
            ->where("name = ?", [$themeName])
            ->execute();
    }
}
