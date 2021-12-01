const urlUtils = {
    /** @var {String} For pages (may contain index.php) */
    baseUrl: '',
    /** @var {String} For assets */
    assetBaseUrl: '',
    /** @var {Env?} */
    env: null,
    /**
     * @param {String} url
     * @returns {String}
     */
    makeUrl(url) {
        return this.baseUrl + this.normalizeUrl(url);
    },
    /**
     * @param {String} url
     * @returns {String}
     */
    makeAssetUrl(url) {
        return this.assetBaseUrl + this.normalizeUrl(url);
    },
    /**
     * @param {String} url
     */
    redirect(url) {
        this.env.window.location.href = this.makeUrl(url);
    },
    /**
     * @param {String} url '/foo' -> 'foo', 'bar' -> 'bar'
     * @returns {String}
     * @access private
     */
    normalizeUrl(url) {
        return url[0] !== '/' ? url : url.substr(1);
    }
};

export {urlUtils};
