import EditApp from './src/EditApp.jsx';
import headingBlockType from './src/headingBlockType.js';
import paragraphBlockType from './src/paragraphBlockType.js';
import formattedTextBlockType from './src/formattedTextBlockType.js';
import listingBlockType from './src/listingBlockType.js';
import {setupServices} from './src/services.js';

// Expose our app so the EditAppAwareWebPage (inside the iframe) can access it
window.kuuraEditApp = preact.createRef();

const config = {};
config.blockTypes = new Map();
config.blockTypes.set('heading', headingBlockType);
config.blockTypes.set('paragraph', paragraphBlockType);
config.blockTypes.set('formatted-text', formattedTextBlockType);
config.blockTypes.set('dynamic-listing', listingBlockType);
config.editAppReactRef = window.kuuraEditApp;

setupServices(config);

window.kuuraCms = {
    registerBlockType(name, blockType) {
        return window.kuuraEditApp.current.registerBlockType(name, blockType);
    }
};

preact.render(preact.createElement(EditApp, {
    ref: window.kuuraEditApp,
}), document.getElementById('doos'));
