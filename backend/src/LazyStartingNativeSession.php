<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\NativeSession;

final class LazyStartingNativeSession extends NativeSession {
    private bool $isStarted = false;
    /** 
     * @param string $bucketKey = 'kuura'
     */
    public function __construct(string $bucketKey = 'kuura') {
        parent::__construct($bucketKey, false);
    }
    /** 
     * @param string $method
     * @param ...$params
     * @return mixed
     */
    private function possiblyStartSessAndThenCall(string $method, ...$params) {
        if (!$this->isStarted) {
            $this->start();
            $this->isStarted = true;
        }
        return parent::{$method}(...$params);
    }
    /** 
     * @param string $key
     * @param mixed $value
     */
    public function put(string $key, $value): void {
        $this->possiblyStartSessAndThenCall('put', $key, $value);
    }
    /** 
     * @param string $key
     * @param mixed $default = null
     * @return mixed
     */
    public function get(string $key, $default = null) {
        return $this->possiblyStartSessAndThenCall('get', $key, $default);
    }
    /**
     * @param string $key
     */
    public function remove(string $key): void {
        $this->possiblyStartSessAndThenCall('remove', $key);
    }
    /**
     */
    public function commit(): void {
        $this->possiblyStartSessAndThenCall('commit');
    }
    /**
     */
    public function destroy(): void {
        $this->possiblyStartSessAndThenCall('destroy');
    }
}
