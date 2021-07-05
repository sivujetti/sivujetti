import {urlUtils} from '../commons/utils.js';
import EditApp from './src/EditApp.jsx';
import InspectorPanel from './src/InspectorPanel.jsx';

urlUtils.baseUrl = window.dataFromAdminBackend.baseUrl;
urlUtils.assetBaseUrl = window.dataFromAdminBackend.assetBaseUrl;

let editAppReactRef = preact.createRef();

window.editApp = {
    /**
     * @param {todo} dataFromWebPage
     * @access public
     */
    handleWebPageLoaded(dataFromWebPage) {
        editAppReactRef.current.handleWebPageLoaded(dataFromWebPage);
    }
};

preact.render(preact.createElement(EditApp, {
    ref: editAppReactRef
}), document.getElementById('main-panel'));

preact.render(preact.createElement(InspectorPanel, {
    //
}), document.getElementById('inpector-panel'));
