<?php declare(strict_types=1);

namespace Sivujetti\Upload\Entities;

final class UploadsEntry {
    /** @var string e.g. "a-cat.png" */
    public string $fileName;
    /** @var ?string e.g. "" or "2021/" or "2021/09/" */
    public string $baseDir;
    /** @var string e.g. "image/png" */
    public string $mime;
    /** @var string "Some file" or "" */
    public string $friendlyName;
    /** @var int */
    public int $createdAt;
    /** @var int */
    public int $updatedAt;
}
