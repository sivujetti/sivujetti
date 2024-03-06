/*
An entry point for global file "public/v2/sivujetti-webpage-renderer-app-main.js".
Included by backend/sivujetti/src/Page/WebPageAwareTemplate.php jsFiles().
*/

import ReRenderingWebPage from './webpage-renderer-app/ReRenderingWebPage.jsx';

/**
 * Mounts <ReRenderingWebPage/> to document.body.
 *
 * @param {CurrentPageData} dataBundle
 */
function mountWebPageRendererApp(dataBundle) {
    printBlockWarnings(dataBundle.page.blocks);
    // temp(dataBundle.page.blocks);

    /** @type {preact.Ref<RenderAllOuter>} */
    const reRenderingWebPage = preact.createRef();
    const outerEl = document.body;
    preact.render(
        <ReRenderingWebPage
            blocks={ dataBundle.page.blocks }
            outerEl={ outerEl }
            ref={ reRenderingWebPage }/>,
        outerEl
    );

    window.addEventListener('message', receiveMessageFromPreviewApp);
    function receiveMessageFromPreviewApp(e) {
        if ((Array.isArray(e.data) ? e.data[0] : '') !== 'establishLinkAndGetPageDataBundle') return;
        const messagePortToEditApp = e.ports[0];
        // Start listening for messages from WebPagePreviewApp
        messagePortToEditApp.onmessage = createMessageChannelController(reRenderingWebPage);
        // Pass the port to ReRenderingWebPage, so it too can send messages to WebPagePreviewApp
        reRenderingWebPage.current.setThisForMessaging(messagePortToEditApp);
        // Pass the data bundle to WebPagePreviewApp & finish up
        messagePortToEditApp.postMessage(['hereIsPageDataBundle', dataBundle]);
        window.removeEventListener('message', receiveMessageFromPreviewApp);
    }
};

/**
 * @param {ReRenderingWebPage} reRenderingWebPage
 * @returns {(e: MessageEvent) => void}
 */
function createMessageChannelController(reRenderingWebPage) {
    return e => {
        if (e.data[0] === 'updateBlocksStyles') {
            //
        } else if (e.data[0] === 'updateBlockStyleFast') {
            //
        } else if (e.data[0] === 'reRenderAllBlocks') {
            //
        } else if (e.data[0] === 'reRenderBlock') {
            //
        } else if (e.data[0] === 'registerEventHandlers') {
            //
        } else if (e.data[0] === 'dsjPressedOrRepeased') {
            //
        }
    };
}

/**
 * @param {mediaScope} mediaScopeId = 'all'
 * @param {String} attrPrefix = ''
 * @returns {HTMLStyleElement|null}
 */
function getCssEl(mediaScopeId = 'all', attrPrefix = '') {
    const iframeDocument = document;
    const validated = toso2[mediaScopeId] || (function () { throw new Error('Invalid media scope'); })();
    return iframeDocument.head.querySelector(`style[data-todo="${attrPrefix}${validated}"]`);
}
 * @param {Array<RawBlock>} blocks
 */
function printBlockWarnings(blocks) {
    // todo warn if listing block contains children
    // todo warn if code block contains children
}

export default mountWebPageRendererApp;
