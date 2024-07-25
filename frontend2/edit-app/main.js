/*
An entry point for global file "public/sivujetti/sivujetti-edit-app.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {
    __,
    api,
    events,
    FloatingDialog,
    isUndoOrRedo,
    scssWizard,
} from '@sivujetti-commons-for-edit-app';
import EditApp from './EditApp.jsx';
import WebPagePreviewApp from './main-column/WebPagePreviewApp.jsx';
import MainColumnViews from './main-column/MainColumnViews.jsx';
import InspectorPanel from './menu-column/InspectorPanel.jsx';
import toasters, {Toaster} from './includes/toasters.jsx';
import patchQuillEditor from './includes/quill-customizations.js';
import globalData from './includes/globalData.js';
import ContextMenu from './includes/ContextMenu.jsx';

configureApis();

preact.render(
    <WebPagePreviewApp
        urlToLoad="@currentUrl"
        highlightRectEls={ [...document.querySelectorAll('.highlight-rect')] }
        ref={ cmp => {
            if (cmp && api.webPagePreview.initialized === false)
                api.webPagePreview = cmp;
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
            const instance = api.saveButton.getInstance();
            // Refresh ScssWizard's styles every time new styles (page) are loaded
            // into the preview iframe, or when an undo|redo event happens
            instance.subscribeToChannel('stylesBundle', (bundle, _userCtx, ctx) => {
                if (ctx === 'initial' || isUndoOrRedo(ctx))
                    scssWizard.replaceStylesState(bundle);
            });
            // Update ScssWizard's 'currentPageIdPair' every time a new page is
            // loaded into the preview iframe
            events.on('webpage-preview-iframe-loaded', () => {
                scssWizard.setCurrentPageInfo(saveButton.getChannelState('currentPageData'));
            });
        } }/>,
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

class ViewAndContextMenuLayer extends preact.Component {
    componentDidMount() {
        const qstr = (window.location.search || ' '); // '?q=/_edit&show-message=page-type-created' or '?show-message=page-type-created'
        const qvars = qstr.substring(1).split('&').map(pair => pair.split('=')).filter(pair => pair.length === 2);
        const messageKey = (qvars.find(([q]) => q === 'show-message') || [])[1];
        const messageCreators = {
            'page-type-created': () => __('Created new %s', __('page type')),
            'page-deleted': () => __('Deleted page "%s".', '').replace(' ""', ''),
        };
        const createMessage = messageKey ? messageCreators[messageKey] : null;
        if (!createMessage) return;
        toasters.editAppMain(
            createMessage(),
            (qvars.find(([q]) => q === 'message-level') || ['', 'success'])[1]
        );
        const pcs = qstr.split('/_edit'); // ['?q=', '&show-message=page-type-created'] or ['?show-message=page-type-created']
        history.replaceState(null, null, location.href.replace(pcs[1] || pcs[0], ''));
    }
    render() { return [
        <ContextMenu ref={ cmp => {
            if (cmp && api.contextMenu.initialized === false) api.contextMenu = cmp;
        } }/>,
        <div id="view">
            <MainColumnViews rootEl={ rootEl }/>
            <FloatingDialog/>
        </div>,
        <Toaster id="editAppMain"/>
    ]; }
}
preact.render(
    <ViewAndContextMenuLayer/>,
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
    patchQuillEditor();
}
