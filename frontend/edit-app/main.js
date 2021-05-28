import EditApp from './src/EditApp.jsx';

// Expose our app so the EditAppAwareWebPage (inside the iframe) can access it
window.kuuraEditApp = preact.createRef();

preact.render(preact.createElement(EditApp, {
    ref: window.kuuraEditApp,
}), document.getElementById('doos'));
