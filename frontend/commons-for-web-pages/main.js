// ## /*
// ## An entry point for global file sivujetti-commons-for-web-pages.js
// ## */
// ## import Http from './src/Http.js';
// ## import {urlUtils} from './src/utils.js';
// ## 
// ## const env = {};
// ## const http = new Http(undefined, url => url.startsWith('/') && !url.startsWith('//') ? urlUtils.makeUrl(url) : url);
// ## 
// ## env.window = window;
// ## env.document = document;
// ## env.csrfToken = '<token>';
// ## //
// ## urlUtils.baseUrl = window.sivujettiBaseUrl || window.dataFromAdminBackend.baseUrl;
// ## urlUtils.assetBaseUrl = window.sivujettiAssetBaseUrl || window.dataFromAdminBackend.assetBaseUrl;
// ## urlUtils.cacheBustStr = window.sivujettiCacheBustStr || (window.dataFromAdminBackend ? window.dataFromAdminBackend.website.versionId : '');
// ## urlUtils.env = env;
// ## 
// ## export {http, env, urlUtils};