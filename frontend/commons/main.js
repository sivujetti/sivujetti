import Http from './Http.js';
import Translator from './Translator.js';
import Signals from './Signals.js';
import {urlUtils} from './utils.js';

const translator = new Translator;
const __ = translator.t.bind(translator);
const http = new Http(undefined, urlUtils.makeUrl.bind(urlUtils));
const signals = new Signals;
const env = {};

export {__, http, translator, signals, env, urlUtils};
