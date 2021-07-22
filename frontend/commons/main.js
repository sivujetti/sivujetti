import Http from './Http.js';
import Translator from './Translator.js';
import Signals from './Signals.js';

const translator = new Translator;
const __ = translator.t.bind(translator);
const http = new Http;
const signals = new Signals;

export {__, http, translator, signals};
