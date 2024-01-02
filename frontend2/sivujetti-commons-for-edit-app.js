/*
An entry point for a global file "public/v2/sivujetti-commons-for-edit-app.js.js" that
can be imported by custom plugins (and the edit app).
*/
import {env, http, urlUtils} from '@sivujetti-commons-for-web-pages';
import Signals from './shared-includes/Signals.js';
import Tabs from './commons-for-edit-app/Tabs.jsx';
import {
    __,
    editAppSignalsInstance,
    editAppTranslatorInstance,
    editAppUserApiInstance,
} from './commons-for-edit-app/edit-app-singletons.js';
import {Icon, iconAsString} from './commons-for-edit-app/Icon.jsx';
import {MenuSection, MenuSectionAbstract} from './commons-for-edit-app/MenuSection.jsx';
import blockTypes, {blockTypeGetIconId} from './commons-for-edit-app/block-types-map.js';
import {stringUtils, timingUtils} from './commons-for-edit-app/utils.js';

const api = {
    blockTypes,
    blockTypeGetIconId,
    inspectorPanel: {
        getEl() { return document.getElementById('inspector-panel'); },
    },
    saveButton: {
        init(saveButtonReactRef) {
            this.saveButtonReactRef = saveButtonReactRef;
        },
        getInstance() {
            return this.saveButtonReactRef.current;
        }
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
    stringUtils,
    Tabs,
    timingUtils,
    editAppTranslatorInstance as translator,
    urlUtils,
};
