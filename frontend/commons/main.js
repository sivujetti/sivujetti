import Http from './Http.js';
import Translator from './Translator.js';

const translator = new Translator;
const __ = translator.t.bind(translator);
const http = new Http;

export {__, http, translator};
