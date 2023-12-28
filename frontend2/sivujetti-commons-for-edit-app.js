/*
An entry point for a global file "public/v2/sivujetti-commons-for-edit-app.js.js" that
can be imported by custom plugins (and the edit app).
*/
import Http from './commons-for-edit-app/Http.js';
import Signals from './commons-for-edit-app/Signals.js';
import Translator from './commons-for-edit-app/Translator.js';
import editAppUrlUtilsInstance from './commons-for-edit-app/url-utils-instance.js';
import {Icon, iconAsString} from './commons-for-edit-app/Icon.jsx';
import {MenuSection, MenuSectionAbstract} from './commons-for-edit-app/MenuSection.jsx';
import blockTypes, {blockTypeGetIconId} from './commons-for-edit-app/block-types-map.js';

const api = {
    blockTypes,
    blockTypeGetIconId,
    saveButton: {
        init(saveButtonReactRef) {
            console.log('inited');
            this.saveButtonReactRef = saveButtonReactRef;
        },
        getInstance() {
            return this.saveButtonReactRef.current;
        }
    }
};

const env = {
    window,
    document,
    csrfToken: '<token>'
};

// todo move to commons-for-web-pages
const http = new Http(undefined, url => url.startsWith('/') && !url.startsWith('//') ? editAppUrlUtilsInstance.makeUrl(url) : url);

const editAppSignalsInstance = new Signals;

const translator = new Translator;
const __ = translator.t.bind(translator);

export {
    __,
    api,
    env,
    http,
    Icon,
    iconAsString,
    MenuSection,
    MenuSectionAbstract,
    editAppSignalsInstance as signals,
    Signals,
    translator,
    editAppUrlUtilsInstance as urlUtils
};
