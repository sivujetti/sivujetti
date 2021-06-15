import EditApp from './src/EditApp.jsx';
import contactFormBlockType from './src/contactFormBlockType.js';
import formattedTextBlockType from './src/formattedTextBlockType.js';
import headingBlockType from './src/headingBlockType.js';
import listingBlockType from './src/listingBlockType.js';
import menuFormBlockType from './src/menuFormBlockType.js';
import paragraphBlockType from './src/paragraphBlockType.js';
import sectionBlockType from './src/sectionBlockType.js';
import {setupServices} from './src/services.js';

// Expose our app so the EditAppAwareWebPage (inside the iframe) can access it
window.kuuraEditApp = preact.createRef();

const config = {};
config.blockTypes = new Map();
config.blockTypes.set('contact-form', contactFormBlockType);
config.blockTypes.set('formatted-text', formattedTextBlockType);
config.blockTypes.set('heading', headingBlockType);
config.blockTypes.set('dynamic-listing', listingBlockType);
config.blockTypes.set('menu', menuFormBlockType);
config.blockTypes.set('paragraph', paragraphBlockType);
config.blockTypes.set('section', sectionBlockType);
config.editAppReactRef = window.kuuraEditApp;
config.EditApp = EditApp;

setupServices(config);

window.kuuraCms = {
    registerBlockType(name, blockType) {
        return window.kuuraEditApp.current.registerBlockType(name, blockType);
    }
};

preact.render(preact.createElement(EditApp, {
    ref: window.kuuraEditApp,
    dataFromBackend: window.dataToEditApp,
}), document.getElementById('doos'));
