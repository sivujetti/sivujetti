/*
An entry point for global file sivujetti-commons-for-web-pages.js
*/
import Http from './src/Http.js';
import {urlUtils} from './src/utils.js';

const env = {};
const http = new Http(undefined, urlUtils.makeUrl.bind(urlUtils));

env.window = window;
env.document = document;
env.csrfToken = '<token>';
//
urlUtils.baseUrl = window.sivujettiBaseUrl || window.dataFromAdminBackend.baseUrl;
urlUtils.assetBaseUrl = window.sivujettiAssetBaseUrl || window.dataFromAdminBackend.assetBaseUrl;
urlUtils.env = env;

export {http, env, urlUtils};