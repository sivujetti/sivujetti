/*
An entry point for global file "public/sivujetti/sivujetti-edit-app.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {__, api} from '@sivujetti-commons-for-edit-app';
import WebPagePreviewApp from './main-column/WebPagePreviewApp.jsx';
import InspectorPanel from './menu-column/InspectorPanel.jsx';
import patchQuillEditor from './includes/quill-customizations.js';
import globalData from './includes/globalData.js';
import EditApp from './EditApp.jsx';
import ViewAndContextMenuLayer from './ViewAndContextMenuLayer.jsx';
import SaveButton from './menu-column/SaveButton.js';

configureApis();

preact.render(
    <WebPagePreviewApp
        urlToLoad="@currentUrl"
        highlightRectEls={ [...document.querySelectorAll('.highlight-rect')] }
        ref={ cmp => {
            if (cmp && !api.webPagePreview.setState)
                api.webPagePreview = cmp;
        } }/>,
    document.getElementById('webpage-preview-app')
);

globalData.theWebsite = window.dataFromAdminBackend.website;
window.dataFromAdminBackend.__websiteDebugOnly = window.dataFromAdminBackend.website;
delete window.dataFromAdminBackend.website;
const editAppOuterEl = api.menuPanel.getOuterEl();
preact.render(
    <EditApp outerEl={ editAppOuterEl }/>,
    editAppOuterEl
);

const inspectorPanelOuterEl = api.inspectorPanel.getOuterEl();
const rootEl = document.getElementById('root');
preact.render(
    <InspectorPanel
        rootEl={ rootEl }
        ref={ cmp => {
            if (cmp) api.inspectorPanel.setInstance(cmp);
        } }/>,
    inspectorPanelOuterEl
);

preact.render(
    <ViewAndContextMenuLayer rootEl={ rootEl }/>,
    document.getElementById('view-and-context-menu-layer')
);

function configureApis() {
    // Common
    window.myRoute = url => {
        preactRouter.route(url);
    };
    // Translations (`__`-function)
    window.translationStringBundles.forEach(strings => {
        api.registerTranslationStrings(strings);
    });
    //
    api.saveButton = new SaveButton;
    patchQuillEditor();
}
