import Translator from './Translator.js';
import Signals from './Signals.js';

const translator = new Translator;
const __ = translator.t.bind(translator);
const signals = new Signals;

export * from '@sivujetti-commons';
export {__, translator, signals};
