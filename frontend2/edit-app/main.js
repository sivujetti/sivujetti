/*
An entry point for global file "public/sivujetti/sivujetti-edit-app.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {api, env, FloatingDialog, isUndoOrRedo, scssWizard} from '@sivujetti-commons-for-edit-app';
import EditApp from './EditApp.jsx';
import WebPagePreviewApp from './main-column/WebPagePreviewApp.jsx';
import MainColumnViews from './main-column/MainColumnViews.jsx';
import InspectorPanel from './menu-column/InspectorPanel.jsx';
import {Toaster} from './includes/toasters.jsx';
import patchQuillEditor from './includes/quill-customizations.js';
import {getMetaKey} from '../shared-inline.js';
import globalData from './includes/globalData.js';

configureApis();

preact.render(
    <WebPagePreviewApp
        urlToLoad="@currentUrl"
        highlightRectEls={ [...document.querySelectorAll('.highlight-rect')] }
        ref={ cmp => {
            if (cmp && api.webPagePreview.initialized === false) {
                api.webPagePreview = cmp;
                const metaKey = getMetaKey();
                const emitMetaKeyIsDown = isDown => {
                    api.webPagePreview.sendMessageToReRenderer(['handleMetaKeyPressedOrReleased', isDown]);
                };
                env.window.addEventListener('keydown', e => {
                    if (e.key === metaKey) emitMetaKeyIsDown(true);
                });
                env.window.addEventListener('keyup', e => {
                    if (e.key === metaKey) emitMetaKeyIsDown(false);
                });
            }
        } }/>,
    document.getElementById('webpage-preview-app')
);

globalData.theWebsite = window.dataFromAdminBackend.website;
window.dataFromAdminBackend.__websiteDebugOnly = window.dataFromAdminBackend.website;
delete window.dataFromAdminBackend.website;
const editAppOuterEl = api.menuPanel.getOuterEl();
preact.render(
    [
        <EditApp
            outerEl={ editAppOuterEl }
            onSaveButtonRefd={ saveButton => {
                if (!saveButton) return;
                api.saveButton.setInstance(saveButton);
                // Refresh scssWizards's styles every time new styles (page) is loaded to
                // the preview iframe, or when undo|redo event happens
                api.saveButton.getInstance().subscribeToChannel('stylesBundle', (bundle, _userCtx, ctx) => {
                    if (ctx === 'initial' || isUndoOrRedo(ctx))
                        scssWizard.replaceStylesState(bundle);
                });
            } }/>,
        <Toaster id="editAppMain"/>
    ],
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
    [
        <MainColumnViews rootEl={ rootEl }/>,
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
        api.registerTranslationStrings(strings);
    });
    //
    patchQuillEditor();
}
