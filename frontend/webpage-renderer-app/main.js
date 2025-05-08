/*
An entry point for global file "public/sivujetti/sivujetti-webpage-renderer-app.js".
Included by backend/sivujetti/src/Page/WebPageAwareTemplate.php jsFiles().
*/
import {cloneDeep} from '../shared-inline.js';
import createInContextEditingApp from './in-context-editing.js';
import {api, createMessageChannelController} from './ReRenderingWebPage.jsx';
/** @typedef {import('./ReRenderingWebPage.jsx').ReRenderingWebPage} ReRenderingWebPage */

/**
 * Mounts <ReRenderingWebPage/> to document.body.
 *
 * @param {CurrentPageData} dataBundle
 */
function mountWebPageRendererApp(dataBundle) {
    // Make a copy here, because WebPagePreviewApp's broadcastCurrentPageData() mutates dataBundle.page.blocks
    const withNested__globalBlockTrees = cloneDeep(dataBundle.page.blocks);
    printBlockWarnings(withNested__globalBlockTrees);

    const inContextEditingApp = window.parent.sivujettiUserFlags?.useInContextEditing
        ? createInContextEditingApp()
        : null;

    /** @type {preact.RefObject<ReRenderingWebPage>} */
    const reRenderingWebPage = preact.createRef();
    const outerEl = document.body;
    const ReRenderingWebPage = api.import('ReRenderingWebPage');
    preact.render(
        <ReRenderingWebPage
            blocks={ withNested__globalBlockTrees }
            outerEl={ outerEl }
            inContextEditingApp={ inContextEditingApp }
            ref={ cmp => {
                if (!cmp || reRenderingWebPage.current) return;
                reRenderingWebPage.current = cmp;
                inContextEditingApp?._init(reRenderingWebPage.current, document.body);
            } }/>,
        outerEl
    );

    window.addEventListener('message', receiveInitialDataFromPreviewApp);
    function receiveInitialDataFromPreviewApp(e) {
        if ((Array.isArray(e.data) ? e.data[0] : '') !== 'establishLinkAndGetPageDataBundle') return;
        const messagePortToEditApp = e.ports[0];
        // Start listening for messages from WebPagePreviewApp
        messagePortToEditApp.addEventListener('message', createMessageChannelController(reRenderingWebPage, messagePortToEditApp));
        messagePortToEditApp.start();
        // Pass the port to ReRenderingWebPage, so it too can send messages to WebPagePreviewApp
        reRenderingWebPage.current.hookUpEventHandlersAndEmitters(messagePortToEditApp, e.data[1]);
        // Pass the data bundle to WebPagePreviewApp & finish up
        messagePortToEditApp.postMessage(['hereIsPageDataBundle', dataBundle]);
        window.removeEventListener('message', receiveInitialDataFromPreviewApp);
    }
}

/**
 * @param {Array<Block>} blocksMut
 */
function printBlockWarnings(blocksMut) {
    // todo warn if listing block contains children
    // todo warn if code block contains children
}

export default {
    mountToDocumentBody: mountWebPageRendererApp,
    api,
};
