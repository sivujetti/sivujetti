/*
An entry point for global file "public/v2/sivujetti-commons-for-web-pages.js" – a
small file that contains common functionalities needed on Sivujetti pages (http,
urlUtils etc.). Usually loaded at the end of the page (see backend/sivujetti/src/
Page/WebPageAwareTemplate.php->jsFiles()).
*/
import UrlUtils from './commons-for-web-pages/UrlUtils.js';
import Http from './commons-for-web-pages/Http.js';
import {urlUtils} from './commons-for-web-pages/singletons.js';
import urlAndSlugUtils from './commons-for-web-pages/url-and-slug-utils.js';

const httpInstance = new Http(
    undefined, // Use default fetchFn (url, settings) => window.fetch(url, settings)
    url => url.startsWith('/') && !url.startsWith('//') ? urlUtils.makeUrl(url) : url
);

const env = {
    window,
    document,
};

export {
    env,
    Http,
    httpInstance as http,
    urlAndSlugUtils,
    urlUtils,
    UrlUtils,
};
