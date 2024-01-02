/*
An entry point for global file "public/v2/sivujetti-commons-for-web-pages.js" – a
small file that contains common functionalities needed on Sivujetti pages (http,
urlUtils etc.). Usually loaded at the end of the page (see backend/sivujetti/src/
Page/WebPageAwareTemplate.php->jsFiles()).
*/
import UrlUtils from './commons-for-web-pages/UrlUtils.js';
import Http from './commons-for-web-pages/Http.js';

const urlUtilsInstance = new UrlUtils(window.sivujettiEnvConfig);

const httpInstance = new Http(
    undefined, // Use default fetchFn (url, settings) => window.fetch(url, settings)
    url => url.startsWith('/') && !url.startsWith('//') ? urlUtilsInstance.makeUrl(url) : url
);

const env = {
    window,
    document,
};

export {
    env,
    httpInstance as http,
    Http,
    urlUtilsInstance as urlUtils,
    UrlUtils,
};
