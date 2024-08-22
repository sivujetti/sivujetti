class UrlUtils {
    // baseUrl; For pages (may contain index.php)
    // assetBaseUrl; For assets
    // currentPageSlug;
    // cacheBustStr; website.versionId by default
    // env;
    /**
     * @param {EnvConfig|{baseUrl?: String; assetBaseUrl?: String; currentPageSlug?: String; cacheBustStr?: String;}} envSettings
     * @param {Env} env
     */
    constructor({baseUrl, assetBaseUrl, currentPageSlug, cacheBustStr}, env = {window}) {
        this.baseUrl = baseUrl || '';
        this.assetBaseUrl = assetBaseUrl || '';
        this.currentPageSlug = currentPageSlug || '';
        this.cacheBustStr = cacheBustStr || '';
        this.env = env;
    }
    /**
     * @param {String} url Example: `foo.png` or `/dir/bar?foo=1`
     * @returns {String} Example: `foo.png?v=abcd` or `/dir/bar?foo=1&v=abcd`
     * @access public
     */
    withCacheBustStr(url) {
        return url + (this.cacheBustStr
            ? `${url.indexOf('?') < 0 ? '?' : '&'}v=${this.cacheBustStr}`
            : '');
    }
    /**
     * @param {String} url
     * @param {Boolean} includeDomain = false
     * @param {Boolean} normalizeQ = true
     * @returns {String}
     * @access public
     */
    makeUrl(url, includeDomain = false, normalizeQ = true) {
        const pref = !includeDomain ? '' : this.env.window.location.origin;
        return pref + this.baseUrl + this.normalizeUrl(url, normalizeQ);
    }
    /**
     * @param {String} url
     * @param {Boolean} includeDomain = false
     * @returns {String}
     * @access public
     */
    makeAssetUrl(url, includeDomain = false) {
        const pref = !includeDomain ? '' : this.env.window.location.origin;
        return pref + this.assetBaseUrl + this.normalizeUrl(url);
    }
    /**
     * @param {String} url
     * @param {Boolean} includeDomain = false
     * @param {Boolean} normalizeQ = false
     * @access public
     */
    redirect(url, includeDomain = false, normalizeQ = false) {
        this.env.window.location.href = this.makeUrl(url, includeDomain, normalizeQ);
    }
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
}

export default UrlUtils;