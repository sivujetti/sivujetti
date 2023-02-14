<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\PikeException;

final class UploadsQFilters {
    /** @var ?array{0: string, 1: string[]} */
    private $byMimeFilter;
    /**
     * @param string $mime e.g. "image/*"
     * @param bool $negate = false
     * @return $this
     */
    public function byMime(string $mime, bool $negate = false): UploadsQFilters {
        $out = new self();
        if ($mime === "image/*")
            $out->byMimeFilter = [!$negate ? "LIKE" : "NOT LIKE", ["image/%"]];
        return $out;
    }
    /**
     * @return array{0: string, 1: string[]}
     */
    public function toQParts(): array {
        if ($this->byMimeFilter)
            return ["`mime` {$this->byMimeFilter[0]} ?", $this->byMimeFilter[1]];
        throw new PikeException("No filters set", PikeException::BAD_INPUT);
    }
}
