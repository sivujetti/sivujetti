import {http, env, urlUtils} from '@sivujetti-commons';
import Translator from './Translator.js';
import Signals from './Signals.js';

const translator = new Translator;
const __ = translator.t.bind(translator);
const signals = new Signals;

export {__, http, translator, signals, env, urlUtils};
