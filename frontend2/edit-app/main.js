/*
An entry point for global file "public/sivujetti/sivujetti-edit-app.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {api, FloatingDialog, scssWizard, translator} from '@sivujetti-commons-for-edit-app';
import EditApp from './EditApp.jsx';
import WebPagePreviewApp from './main-column/WebPagePreviewApp.jsx';
import MainColumnViews from './main-column/MainColumnViews.jsx';
import InspectorPanel from './menu-column/InspectorPanel.jsx';
import {Toaster} from './includes/toasters.jsx';
import patchQuillEditor from './includes/quill-customizations.js';
import globalData from './includes/globalData.js';

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

globalData.theWebsite = window.dataFromAdminBackend.website;
window.dataFromAdminBackend.__websiteDebugOnly = window.dataFromAdminBackend.website;
delete window.dataFromAdminBackend.website;
const editAppOuterEl = api.menuPanel.getOuterEl();
preact.render(
    <EditApp
        outerEl={ editAppOuterEl }
        onSaveButtonRefd={ saveButton => {
            if (!saveButton) return;
            api.saveButton.setInstance(saveButton);
            // Refresh scssWizards's styles every time new styles (page) is loaded to
            // the preview iframe, or when undo|redo event happens
            api.saveButton.getInstance().subscribeToChannel('stylesBundle', (bundle, _userCtx, ctx) => {
                if (ctx === 'initial' || ctx === 'undo' || ctx === 'redo')
                    scssWizard.replaceStylesState(bundle);
            });
        } }/>,
    editAppOuterEl
);

const inspectorPanelOuterEl = api.inspectorPanel.getOuterEl();
const rootEl = document.getElementById('root');
preact.render(
    <InspectorPanel
        outerEl={ inspectorPanelOuterEl }
        editAppOuterEl={ editAppOuterEl }
        rootEl={ rootEl }
        ref={ cmp => {
            if (cmp) api.inspectorPanel.setInstance(cmp);
        } }/>,
    inspectorPanelOuterEl
);

preact.render(
    [
        <MainColumnViews
            rootEl={ rootEl }/>,
        <Toaster id="editAppMain"/>,
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
    //
    patchQuillEditor();
}
