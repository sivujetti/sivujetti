/*
An entry point for global file "public/v2/sivujetti-edit-app-main.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {api} from './sivujetti-commons-unified.js';
import EditApp from './edit-app/EditApp.jsx';
import WebPagePreviewIframe, {FooTemp} from './edit-app/main-column/Foo.jsx';
import InspectorPanel from './edit-app/menu-column/InspectorPanel.jsx';

window.myRoute = url => {
    preactRouter.route(url);
};

// <div id="view"></div> todo

const editAppOuterEl = document.getElementById('edit-app');
preact.render(
    <EditApp
        outerEl={ editAppOuterEl }
        dataFromAdminBackend={ window.dataFromAdminBackend }
        onMounted={ cmp => {
            api.saveButton.init(cmp.saveButtonRef);
        } }/>,
    editAppOuterEl
);

const inspectorPanelOuterEl = api.inspectorPanel.getEl();
preact.render(
    <InspectorPanel
        outerEl={ inspectorPanelOuterEl }
        editAppOuterEl={ editAppOuterEl }
        rootEl={ document.getElementById('root') }/>,
    inspectorPanelOuterEl
);

preact.render(
    <WebPagePreviewIframe urlToLoad="@currentUrl"/>,
    document.getElementById('webpage-preview-app')
);


/*const webPagePreview = new FooTemp;
webPagePreview.mount(':currentUrl');*/
