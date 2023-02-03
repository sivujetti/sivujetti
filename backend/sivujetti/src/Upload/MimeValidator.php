<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\PikeException;

final class MimeValidator {
    private const nonspecificTypes = [
        "application/octet-stream",
        "application/encrypted",
        "application/CDFV2-encrypted",
        "application/zip",
    ];
    /**
     * https://github.com/WordPress/WordPress/blob/facdf664c9f01d4f37e4abecb62b9accbdbd2e63/wp-includes/functions.php#L3053
     *
     * @param array{name: string, tmp_name: string} $inputFile $_FILES["some-file"]
     * @param string[] $allowed = null
     * @return array{0: string|null, 1: string|null} [mime, ext]
     * @throws \Pike\PikeException If $inputFile has not extension, or finfo_open() fails
     */
    public function getAllowedMimeAndExt(array $inputFile, ?array $allowed = null): array {
        $inputFilePath = $inputFile["name"];
        $tempFilePath = $inputFile["tmp_name"];

        // 1. get mime from input filename ($_FILES[$key]["name"])
        [$ext, $mimeFromInputFileName] = self::getExtAndMimeFromString($inputFilePath);
        if (!$ext) throw new PikeException("File extension not recognized",
                                           PikeException::BAD_INPUT);

        // 2. Check that $mimeFromInputFileName checks out with the real mime
        if (str_starts_with($mimeFromInputFileName, "image/")) {
            if (!$this->isSupportedImageMime($mimeFromInputFileName, $tempFilePath))
                return [null, null];
        } else {
            if (!$this->isSupportedNonImageMime($mimeFromInputFileName, $tempFilePath))
                return [null, null];
        }

        // 3. Check that the mime is in the list of allowed mimes
        return in_array($mimeFromInputFileName, $allowed !== null ? $allowed : ["image/jpeg", "application/pdf"], true)
            ? [$mimeFromInputFileName, $ext]
            : [null, null];
    }
    /**
     * @param string[] $mimes ["png","jpg","jpe"]
     * @return string[] ["image/png", "image/jpeg"]
     * @throws \Pike\PikeException
     */
    public static function extsToMimes(array $exts): array {
        $map = [];
        foreach ($exts as $ext) {
            $mime = self::extToMime($ext);
            if (!$mime) throw new PikeException("File extension `{$ext}` not recognized",
                                                PikeException::DOING_IT_WRONG);
            $map[$mime] = 1;
        }
        return array_keys($map);
    }
    /**
     * @param string $filePath
     * @return array{0: string|null, 1: string|null}
     */
    private static function getExtAndMimeFromString(string $filePath): array {
        $pcs = explode(".", $filePath);
        if (count($pcs) < 2)
            return [null, null];
        //
        $ext = $pcs[count($pcs) - 1];
        $mime = self::extToMime($ext);
        //
        return $mime ? [$ext, $mime] : [null, null];
    }
    /**
     * @param string $mimeFromInputFileName
     * @param string $fullFilePath
     * @return bool
     */
    private function isSupportedImageMime(string $mimeFromInputFileName, string $fullFilePath): bool {
        $realMime = self::getRealMime($fullFilePath);
        return $realMime === $mimeFromInputFileName;
    }
    /**
     * @param string $mimeFromInputFileName
     * @param string $fullFilePath
     * @return bool
     */
    private function isSupportedNonImageMime(string $mimeFromInputFileName, string $fullFilePath): bool {
        $realMime = self::getRealMime($fullFilePath);
        /*
        If $realMime doesn't match the content type we're expecting from the file's extension,
        we need to do some additional vetting. Media types and those listed in ::nonspecificTypes are
        allowed some leeway, but anything else must exactly match the real content type.
        */
        if (in_array($realMime, self::nonspecificTypes, true)) {
            $subst = substr($mimeFromInputFileName, 0, strcspn($mimeFromInputFileName, "/"));
            return in_array($subst, ["application", "video", "audio"], true);
        }
        /*
        For these types, only the major type must match the real value. This means that
        common mismatches are forgiven: application/vnd.apple.numbers is often misidentified as application/zip,
        and some media files are commonly named with the wrong extension (.mov instead of .mp4)
        */
        if (str_starts_with($mimeFromInputFileName, "video/") || str_starts_with($mimeFromInputFileName, "audio/")) {
            $a = substr($realMime, 0, strcspn($realMime, "/"));
            $b = substr($mimeFromInputFileName, 0, strcspn($mimeFromInputFileName, "/"));
            return $a === $b;
        }

        return match ($realMime) {
            // A few common file types are occasionally detected as text/plain; allow those.
            "text/plain" => in_array($mimeFromInputFileName, [
                "text/plain",
                "text/csv",
                "application/csv",
                "text/richtext",
                "text/tsv",
                "text/vtt",
            ], true),
            // Special casing for CSV files.
            "application/csv" => in_array($mimeFromInputFileName, [
                "text/csv",
                "text/plain",
                "application/csv",
            ], true),
            // Special casing for RTF files.
            "text/rtf" => in_array($mimeFromInputFileName, [
                "text/rtf",
                "text/plain",
                "application/rtf",
            ], true),
            /*
            Everything else including image/* and application/*: If the real content
            type doesn't match the file extension, assume it's dangerous.
            */
            default => $mimeFromInputFileName === $realMime,
        };
    }
    /**
     * @param string $fullFilePath
     * @return string|null
     */
    private static function getRealMime(string $fullFilePath): ?string {
        if (($finfo = \finfo_open(FILEINFO_MIME_TYPE)) === false)
            throw new PikeException("finfo_open() failed", PikeException::FAILED_FS_OP);
        $realMime = \finfo_file($finfo, $fullFilePath) ?? null;
        \finfo_close($finfo);
        return $realMime;
    }
    /**
     * https://github.com/WordPress/WordPress/blob/d533b76ef848528304a5ef08b82cc6e674eeb3cc/wp-includes/functions.php#L3325
     *
     * @param string $ext
     * @return string|null
     */
    private static function extToMime(string $ext): ?string {
        return match ($ext) {
            // Image formats.
            'jpg','jpeg','jpe'             => 'image/jpeg',
            'gif'                          => 'image/gif',
            'png'                          => 'image/png',
            'bmp'                          => 'image/bmp',
            'tiff','tif'                   => 'image/tiff',
            'webp'                         => 'image/webp',
            'ico'                          => 'image/x-icon',
            // Video formats.
            'asf','asx'                    => 'video/x-ms-asf',
            'wmv'                          => 'video/x-ms-wmv',
            'wmx'                          => 'video/x-ms-wmx',
            'wm'                           => 'video/x-ms-wm',
            'avi'                          => 'video/avi',
            'divx'                         => 'video/divx',
            'flv'                          => 'video/x-flv',
            'mov','qt'                     => 'video/quicktime',
            'mpeg','mpg','mpe'             => 'video/mpeg',
            'mp4','m4v'                    => 'video/mp4',
            'ogv'                          => 'video/ogg',
            'webm'                         => 'video/webm',
            'mkv'                          => 'video/x-matroska',
            '3gp','3gpp'                   => 'video/3gpp',  // Can also be audio.
            '3g2','3gp2'                   => 'video/3gpp2', // Can also be audio.
            // Text formats.
            'txt','asc','c','cc','h','srt' => 'text/plain',
            'csv'                          => 'text/csv',
            'tsv'                          => 'text/tab-separated-values',
            'ics'                          => 'text/calendar',
            'rtx'                          => 'text/richtext',
            'css'                          => 'text/css',
            'htm','html'                   => 'text/html',
            'vtt'                          => 'text/vtt',
            'dfxp'                         => 'application/ttaf+xml',
            // Audio formats.
            'mp3','m4a','m4b'              => 'audio/mpeg',
            'aac'                          => 'audio/aac',
            'ra','ram'                     => 'audio/x-realaudio',
            'wav'                          => 'audio/wav',
            'ogg','oga'                    => 'audio/ogg',
            'flac'                         => 'audio/flac',
            'mid','midi'                   => 'audio/midi',
            'wma'                          => 'audio/x-ms-wma',
            'wax'                          => 'audio/x-ms-wax',
            'mka'                          => 'audio/x-matroska',
            // Misc application formats.
            'rtf'                          => 'application/rtf',
            'js'                           => 'application/javascript',
            'pdf'                          => 'application/pdf',
            'swf'                          => 'application/x-shockwave-flash',
            'class'                        => 'application/java',
            'tar'                          => 'application/x-tar',
            'zip'                          => 'application/zip',
            'gz','gzip'                    => 'application/x-gzip',
            'rar'                          => 'application/rar',
            '7z'                           => 'application/x-7z-compressed',
            'exe'                          => 'application/x-msdownload',
            'psd'                          => 'application/octet-stream',
            'xcf'                          => 'application/octet-stream',
            // MS Office formats.
            'doc'                          => 'application/msword',
            'pot','pps','ppt'              => 'application/vnd.ms-powerpoint',
            'wri'                          => 'application/vnd.ms-write',
            'xla','xls','xlt','xlw'        => 'application/vnd.ms-excel',
            'mdb'                          => 'application/vnd.ms-access',
            'mpp'                          => 'application/vnd.ms-project',
            'docx'                         => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'docm'                         => 'application/vnd.ms-word.document.macroEnabled.12',
            'dotx'                         => 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
            'dotm'                         => 'application/vnd.ms-word.template.macroEnabled.12',
            'xlsx'                         => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xlsm'                         => 'application/vnd.ms-excel.sheet.macroEnabled.12',
            'xlsb'                         => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
            'xltx'                         => 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
            'xltm'                         => 'application/vnd.ms-excel.template.macroEnabled.12',
            'xlam'                         => 'application/vnd.ms-excel.addin.macroEnabled.12',
            'pptx'                         => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'pptm'                         => 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
            'ppsx'                         => 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
            'ppsm'                         => 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
            'potx'                         => 'application/vnd.openxmlformats-officedocument.presentationml.template',
            'potm'                         => 'application/vnd.ms-powerpoint.template.macroEnabled.12',
            'ppam'                         => 'application/vnd.ms-powerpoint.addin.macroEnabled.12',
            'sldx'                         => 'application/vnd.openxmlformats-officedocument.presentationml.slide',
            'sldm'                         => 'application/vnd.ms-powerpoint.slide.macroEnabled.12',
            'onetoc','onetoc2','onetmp','onepkg' => 'application/onenote',
            'oxps'                         => 'application/oxps',
            'xps'                          => 'application/vnd.ms-xpsdocument',
            // OpenOffice formats.
            'odt'                          => 'application/vnd.oasis.opendocument.text',
            'odp'                          => 'application/vnd.oasis.opendocument.presentation',
            'ods'                          => 'application/vnd.oasis.opendocument.spreadsheet',
            'odg'                          => 'application/vnd.oasis.opendocument.graphics',
            'odc'                          => 'application/vnd.oasis.opendocument.chart',
            'odb'                          => 'application/vnd.oasis.opendocument.database',
            'odf'                          => 'application/vnd.oasis.opendocument.formula',
            // WordPerfect formats.
            'wp','wpd'                     => 'application/wordperfect',
            // iWork formats.
            'key'                          => 'application/vnd.apple.keynote',
            'numbers'                      => 'application/vnd.apple.numbers',
            'pages'                        => 'application/vnd.apple.pages',
            // Font formats.
            'ttf'                          => 'font/ttf',
            'eot'                          => 'font/eot',
            'otf'                          => 'font/otf',
            'woff'                         => 'font/woff',
            'woff2'                        => 'font/woff2',
            default                        => null,
        };
    }
}
