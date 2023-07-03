const urlUtils = {
    /** @var {String} For pages (may contain index.php) */
    baseUrl: '',
    /** @var {String} For assets */
    assetBaseUrl: '',
    /** @var {String} website.versionId by default */
    cacheBustStr: '',
    /** @var {Env?} */
    env: null,
    /**
     * @param {String} url
     * @param {Boolean} includeDomain = false
     * @returns {String}
     */
    makeUrl(url, includeDomain = false) {
        const pref = !includeDomain ? '' : this.env.window.location.origin;
        return pref + this.baseUrl + this.normalizeUrl(url, true);
    },
    /**
     * @param {String} url
     * @param {Boolean} includeDomain = false
     * @returns {String}
     */
    makeAssetUrl(url, includeDomain = false) {
        const pref = !includeDomain ? '' : this.env.window.location.origin;
        return pref + this.assetBaseUrl + this.normalizeUrl(url);
    },
    /**
     * @param {String} url
     * @param {Boolean} includeDomain = false
     */
    redirect(url, includeDomain = false) {
        this.env.window.location.href = this.makeUrl(url, includeDomain);
    },
    /**
     * @param {String} url '/foo' -> 'foo', 'bar' -> 'bar'
     * @param {Boolean} normalizeQ = false
     * @returns {String}
     * @access private
     */
    normalizeUrl(url, normalizeQ = false) {
        const url2 = !normalizeQ || this.baseUrl.indexOf('?') < 0 ? url : url.replace('?', '&');
        return url2[0] !== '/' ? url2 : url2.substring(1);
    }
};

export {urlUtils};
