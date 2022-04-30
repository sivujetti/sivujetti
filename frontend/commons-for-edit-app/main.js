/*
An entry point for global file sivujetti-commons-for-edit-app.js
*/
import Translator from './src/Translator.js';
import Signals from './src/Signals.js';
import setupForm from './src/Form3.jsx';
import {http, env, urlUtils} from '../commons-for-web-pages/main.js';

const translator = new Translator;
const __ = translator.t.bind(translator);
setupForm({__, env});
const signals = new Signals;
/** @type {SivujettiFrontendApi} */
const api = {}; // see frontend/edit-app/main.js

export * from './src/Form3.jsx';
export * from './src/FloatingDialog.jsx';
export * from './src/Icon.jsx';
export * from './src/MenuSection.jsx';
export {http, env, urlUtils, __, translator, signals, api};
