import EditApp from './src/EditApp.jsx';
import {setupServices} from './src/services.js';

// Expose our app so the EditAppAwareWebPage (inside the iframe) can access it
window.kuuraEditApp = preact.createRef();

setupServices({
    editAppReactRef: window.kuuraEditApp
});

window.kuuraCms = {
    registerBlockType(name, blockType) {
        return window.kuuraEditApp.current.registerBlockType(name, blockType);
    }
};

preact.render(preact.createElement(EditApp, {
    ref: window.kuuraEditApp,
}), document.getElementById('doos'));
