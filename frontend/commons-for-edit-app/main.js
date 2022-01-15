/*
An entry point for global file sivujetti-commons-for-edit-app.js
*/
import Translator from './src/Translator.js';
import Signals from './src/Signals.js';
import setDoTranslate from './src/Form3.jsx';

const translator = new Translator;
const __ = translator.t.bind(translator);
const signals = new Signals;
setDoTranslate(__);

export * from '../commons-for-web-pages/main.js';
export * from './src/Form3.jsx';
export {__, translator, signals};
