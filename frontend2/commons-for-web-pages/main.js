/*
An entry point for global file "public/sivujetti/sivujetti-commons-for-web-pages.js" – a
small file that contains common functionalities needed on Sivujetti pages (http,
urlUtils etc.). Usually loaded at the end of the page (see backend/sivujetti/src/
Page/WebPageAwareTemplate.php->jsFiles()).
*/
import UrlUtils from './UrlUtils.js';
import Http from './Http.js';
import {urlUtils} from './singletons.js';
import urlAndSlugUtils from './url-and-slug-utils.js';

const httpInstance = new Http(
    undefined, // Use default fetchFn (url, settings) => window.fetch(url, settings)
    url => url.startsWith('/') && !url.startsWith('//') ? urlUtils.makeUrl(url) : url
);

const env = {
    window,
    document,
    normalTypingDebounceMillis: 400, // ??
};

export {
    env,
    Http,
    httpInstance as http,
    urlAndSlugUtils,
    urlUtils,
    UrlUtils,
};
