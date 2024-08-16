/*
An entry point for global file "public/sivujetti/sivujetti-webpage-renderer-app.js".
Included by backend/sivujetti/src/Page/WebPageAwareTemplate.php jsFiles().
*/
import ReRenderingWebPage, {api} from './ReRenderingWebPage.jsx';

/**
 * Mounts <ReRenderingWebPage/> to document.body.
 *
 * @param {CurrentPageData} dataBundle
 */
function mountWebPageRendererApp(dataBundle) {
    printBlockWarnings(dataBundle.page.blocks);

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
        reRenderingWebPage.current.hookUpEventHandlersAndEmitters(messagePortToEditApp);
        // Pass the data bundle to WebPagePreviewApp & finish up
        messagePortToEditApp.postMessage(['hereIsPageDataBundle', dataBundle]);
        window.removeEventListener('message', receiveMessageFromPreviewApp);
    }
}

/**
 * @param {ReRenderingWebPage} reRenderingWebPage
 * @returns {(e: MessageEvent) => void}
 */
function createMessageChannelController(reRenderingWebPage) {
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
            const updatedBlock = e.data[1];
            const newBlocks = e.data[2];
            reRenderingWebPage.current.exchangeSingleBlock(updatedBlock, newBlocks);
        } else if (e.data[0] === 'handleMetaKeyPressedOrReleased') {
            const isDown = e.data[1];
            reRenderingWebPage.current.handleEditAppMetaKeyPressedOrReleased(isDown);
        }
    };
}

/**
 * @param {String} attrPrefix = ''
 * @returns {HTMLStyleElement|null}
 */
function getCssEl(attrPrefix = '') {
    const iframeDocument = document;
    return iframeDocument.head.querySelector(`style[data-scope="${attrPrefix}all"]`);
}

/**
 * @param {Array<Block>} blocks
 */
function printBlockWarnings(blocks) {
    // todo warn if listing block contains children
    // todo warn if code block contains children
}

export default {
    mountToDocumentBody: mountWebPageRendererApp,
    api,
};
