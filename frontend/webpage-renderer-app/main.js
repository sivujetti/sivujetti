/*
An entry point for global file "public/sivujetti/sivujetti-webpage-renderer-app.js".
Included by backend/sivujetti/src/Page/WebPageAwareTemplate.php jsFiles().
*/
import {cloneDeep} from '../shared-inline.js';
import {api} from './ReRenderingWebPage.jsx';

/**
 * Mounts <ReRenderingWebPage/> to document.body.
 *
 * @param {CurrentPageData} dataBundle
 */
function mountWebPageRendererApp(dataBundle) {
    // Make a copy here, because WebPagePreviewApp's broadcastCurrentPageData() mutates dataBundle.page.blocks
    const withNested__globalBlockTrees = cloneDeep(dataBundle.page.blocks);
    printBlockWarnings(withNested__globalBlockTrees);

    /** @type {preact.Ref<RenderAllOuter>} */
    const reRenderingWebPage = preact.createRef();
    const outerEl = document.body;
    const ReRenderingWebPage = api.import('ReRenderingWebPage');
    preact.render(
        <ReRenderingWebPage
            blocks={ withNested__globalBlockTrees }
            outerEl={ outerEl }
            ref={ reRenderingWebPage }/>,
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
 * @param {ReRenderingWebPage} reRenderingWebPage
 * @param {MessagePort} messagePortToEditApp
 * @returns {(e: MessageEvent) => void}
 */
function createMessageChannelController(reRenderingWebPage, messagePortToEditApp) {
    return e => {
        if (e.data[0] === 'updateBlocksStyles') {
            const cssCompiled = e.data[1];
            // Clear any styles set during 'updateBlockStyleFast'
            const fastCssEl = getCssEl('fast-');
            fastCssEl.innerHTML = '';
            // Set the committed styles
            const el = getCssEl();
            el.innerHTML = cssCompiled;
        } else if (e.data[0] === 'updateBlockStyleFast') {
            const [_, css, _blockId] = e.data;
            const el = getCssEl('fast-');
            el.innerHTML = css;
        } else if (e.data[0] === 'reRenderAllBlocks') {
            const newBlocks = e.data[1];
            reRenderingWebPage.current.exchangeBlocks(newBlocks);
        } else if (e.data[0] === 'reRenderBlock') {
            const newBlocks = e.data[2];
            const updatedBlock = e.data[1];
            reRenderingWebPage.current.exchangeSingleBlock(updatedBlock, newBlocks);
        } else if (e.data[0] === 'handleMetaKeyPressedOrReleased') {
            const isDown = e.data[1];
            reRenderingWebPage.current.handleEditAppMetaKeyPressedOrReleased(isDown);
        } else if (e.data[0] === 'getMouseState') {
            messagePortToEditApp.postMessage(['getMouseState-return', reRenderingWebPage.current.getMouseState()]);
        }
    };
}

/**
 * @param {string} attrPrefix = ''
 * @returns {HTMLStyleElement|null}
 */
function getCssEl(attrPrefix = '') {
    const iframeDocument = document;
    return iframeDocument.head.querySelector(`style[data-scope="${attrPrefix}all"]`);
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
