import {urlUtils} from './singletons.js';

const urlAndSlugUtils = {
    /**
     * @param {String} url '/pagename' or '/public/uploads/filename.png' or <external>
     * @returns {String} '/base/pagename' or '/base/public/uploads/filename.png' or <external>
     */
    getCompletedUrl(url) {
        if (!url.length || url.startsWith('#')) return url;
        //
        const isAlreadyCompleted = url.startsWith(urlUtils.baseUrl);
        if (isAlreadyCompleted) return url;
        //
        const isLocal = url.startsWith('/') && !url.startsWith('//');
        if (isLocal) {
            const isImage = url.startsWith('/public/uploads/');
            return !isImage ? urlUtils.makeUrl(url) : urlUtils.makeAssetUrl(url);
        }
        //
        return this.normalizeExternalUrl(url);
    },
    /**
     * @param {String} url
     * @returns {String}
     */
    normalizeExternalUrl(url) {
        if (/^[a-zA-Z]+:.+$/.test(url)) // http://foo.com, mailto:foo, steam://store/1151640, not foo.com/path:1
            return url;
        // No protocol ('foo.com', '//foo.com', foo.com/path:1)
        return `http://${url}`;
    }
};

export default urlAndSlugUtils;
