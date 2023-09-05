<?php declare(strict_types=1);

namespace Sivujetti\Update;

interface PackageStreamInterface {
    public const FILE_NS_BACKEND = "\$backend/";
    public const FILE_NS_INDEX = "\$index/";
    public const LOCAL_NAME_BACKEND_FILES_LIST = "\$backend-files-list.php";
    public const LOCAL_NAME_INDEX_FILES_LIST = "\$index-files-list.php";
    public const LOCAL_NAME_DB_DATA = "db-data.php";
    /**
     * @param string $filePath
     * @param bool $create = false
     * @return string $tmpFilePath
     * @throws \Pike\PikeException
     */
    public function open(string $filePath, bool $create = false): string;
    /**
     * @param string $filePath
     * @param ?string $localName = null
     * @param int $start = 0
     * @param int $length = 0
     * @return bool
     * @throws \Pike\PikeException
     */
    public function addFile(string $filePath,
                            ?string $localName = null,
                            int $start = 0,
                            int $length = 0): bool;
    /**
     * @param string $localName
     * @param string[] $localNames
     * @return bool
     * @throws \Pike\PikeException
     */
    public function addFileMap(string $localName, array $localNames): bool;
    /**
     * @param string $localName
     * @param string $contents
     * @return bool
     * @throws \Pike\PikeException
     */
    public function addFromString(string $localName, string $contents): bool;
    /**
     * @param string $localName
     * @return string
     * @throws \Pike\PikeException
     */
    public function read(string $localName): string;
    /**
     * @param string $destinationPath
     * @param string[]|string|null $localNames = []
     * @param ?string $prefixToStripFromLocalNames = null
     * @return bool
     * @throws \Pike\PikeException
     */
    public function extractMany(string $destinationPath,
                                mixed $localNames = [],
                                ?string $prefixToStripFromLocalNames = null): bool;
    /**
     * @param int $flags = 0
     * @return string
     * @throws \Pike\PikeException
     */
    public function getResult(int $flags = 0): string;
}
