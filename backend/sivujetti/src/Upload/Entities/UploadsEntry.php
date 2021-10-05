<?php declare(strict_types=1);

namespace Sivujetti\Upload\Entities;

final class UploadsEntry {
    /** @var string e.g. "a-cat.png" */
    public string $fileName;
    /** @var string e.g. "2021/", "2021/09/" or "" */
    public string $baseDir;
    /** @var string e.g. "image/png" */
    public string $mime;
    /** @var string "Some file" or "" */
    public string $friendlyName;
    /** @var int Unix timestamp or 0 */
    public int $createdAt;
    /** @var int Unix timestamp or 0 */
    public int $updatedAt;
}
