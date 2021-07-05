const urlUtils = {
    /** @var {string} For pages (may contain index.php) */
    baseUrl: '',
    /** @var {string} For assets */
    assetBaseUrl: '',
    /**
     * @param {string} url
     * @returns {string}
     */
    makeUrl(url) {
        console.log(this.baseUrl);
        return this.baseUrl + this.normalizeUrl(url);
    },
    /**
     * @param {string} url
     * @returns {string}
     */
    makeAssetUrl(url) {
        return this.assetBaseUrl + this.normalizeUrl(url);
    },
    /**
     * @param {string} url '/foo' -> 'foo', 'bar' -> 'bar'
     * @returns {string}
     */
    normalizeUrl(url) {
        return url[0] !== '/' ? url : url.substr(1);
    }
};

export {urlUtils};
