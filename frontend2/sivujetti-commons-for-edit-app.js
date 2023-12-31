/*
An entry point for a global file "public/v2/sivujetti-commons-for-edit-app.js.js" that
can be imported by custom plugins (and the edit app).
*/
import Signals from './what/Signals.js';
import Tabs from './commons-for-edit-app/Tabs.jsx';
import {
    __,
    editAppHttpInstance,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    editAppUrlUtilsInstance,
} from './commons-for-edit-app/edit-app-singletons.js';
import {Icon, iconAsString} from './commons-for-edit-app/Icon.jsx';
import {MenuSection, MenuSectionAbstract} from './commons-for-edit-app/MenuSection.jsx';
import blockTypes, {blockTypeGetIconId} from './commons-for-edit-app/block-types-map.js';
import {stringUtils, timingUtils} from './commons-for-edit-app/utils.js';

const api = {
    blockTypes,
    blockTypeGetIconId,
    saveButton: {
        init(saveButtonReactRef) {
            this.saveButtonReactRef = saveButtonReactRef;
        },
        getInstance() {
            return this.saveButtonReactRef.current;
        }
    },
    inspectorPanel: {
        getEl() { return document.getElementById('inspector-panel'); },
    },
    webPageIframe: { // todo
        getEl() {
            document.body.querySelector('#site-preview-iframe');
        },
        highlightBlock(block) {
            //
        },
        unHighlightBlock(blockId) {
            //
        },
        unHighlightTextBlockChildEl() {
            //
        },
        highlightTextBlockChildEl(elIdx, textBlockId) {
            //
        },
        scrollToBlock() {
            //
        }
    }
};

const env = {
    window,
    document,
    csrfToken: '<token>'
};

export {
    __,
    api,
    env,
    editAppHttpInstance as http,
    Icon,
    iconAsString,
    MenuSection,
    MenuSectionAbstract,
    editAppSignalsInstance as signals,
    Signals,
    stringUtils,
    Tabs,
    timingUtils,
    editAppTranslatorInstance as translator,
    editAppUrlUtilsInstance as urlUtils
};
