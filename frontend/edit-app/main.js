import EditApp from './src/EditApp.jsx';
import InspectorPanel from './src/InspectorPanel.jsx';

preact.render(preact.createElement(EditApp, {
    //
}), document.getElementById('block-tree-panel'));

preact.render(preact.createElement(InspectorPanel, {
    //
}), document.getElementById('inpector-panel'));
