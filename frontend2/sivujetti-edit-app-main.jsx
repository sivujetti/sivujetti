/*
An entry point for global file "public/v2/sivujetti-edit-app-main.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {api, FloatingDialog, translator} from './sivujetti-commons-unified.js';
import EditApp from './edit-app/EditApp.jsx';
import WebPagePreviewApp from './edit-app/main-column/WebPagePreviewApp.jsx';
import MainColumnViews from './edit-app/main-column/MainColumnViews.jsx';
import InspectorPanel from './edit-app/menu-column/InspectorPanel.jsx';

configureApis();

preact.render(
    <WebPagePreviewApp
        urlToLoad="@currentUrl"
        highlightRectEl={ document.querySelector('.highlight-rect') }
        ref={ cmp => {
            if (cmp) {
                api.webPagePreview = cmp;
            }
        } }/>,
    document.getElementById('webpage-preview-app')
);

const editAppOuterEl = api.menuPanel.getOuterEl();
preact.render(
    <EditApp
        outerEl={ editAppOuterEl }
        onSaveButtonRefd={ saveButton => {
            if (!saveButton) return;
            api.saveButton.init(saveButton);
        } }/>,
    editAppOuterEl
);

const inspectorPanelOuterEl = api.inspectorPanel.getOuterEl();
const rootEl = document.getElementById('root');
preact.render(
    <InspectorPanel
        outerEl={ inspectorPanelOuterEl }
        editAppOuterEl={ editAppOuterEl }
        rootEl={ rootEl }/>,
    inspectorPanelOuterEl
);

preact.render(
    [
        <MainColumnViews
            rootEl={ rootEl }/>,
        <FloatingDialog/>
    ],
    document.getElementById('view')
);

function configureApis() {
    // Common
    window.myRoute = url => {
        preactRouter.route(url);
    };
    // Translations (`__`-function)
    window.translationStringBundles.forEach(strings => {
        translator.addStrings(strings);
    });
}
