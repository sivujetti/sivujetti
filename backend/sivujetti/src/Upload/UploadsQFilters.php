<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\PikeException;

final class UploadsQFilters {
    /** @var ?array<int, string> */
    private $byMimeFilterVals;
    /**
     * @param string $mime e.g. "image/*"
     * @return $this
     */
    public function byMime(string $mime): UploadsQFilters {
        $out = new self();
        if ($mime === "image/*")
            $out->byMimeFilterVals = ["image/%"];
        return $out;
    }
    /**
     * @return array{0: string, 1: string[]}
     */
    public function toQParts(): array {
        if ($this->byMimeFilterVals)
            return ["`mime` LIKE ?", $this->byMimeFilterVals];
        throw new PikeException("No filters set", PikeException::BAD_INPUT);
    }
}
