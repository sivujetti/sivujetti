/*
An entry point for global file "public/v2/sivujetti-webpage-renderer-app-main.js".
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
        reRenderingWebPage.current.setThisForMessaging(messagePortToEditApp);
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
            //
        } else if (e.data[0] === 'updateBlockStyleFast') {
            //
        } else if (e.data[0] === 'reRenderAllBlocks') {
            const newBlocks = e.data[1];
            reRenderingWebPage.current.exchangeBlocks(newBlocks);
        } else if (e.data[0] === 'reRenderBlock') {
            const updatedBlock = e.data[1];
            const newBlocks = e.data[2];
            reRenderingWebPage.current.exchangeSingleBlock(updatedBlock, newBlocks);
        } else if (e.data[0] === 'registerEventHandlers') {
            //
        } else if (e.data[0] === 'dsjPressedOrRepeased') {
            //
        }
    };
}

/**
 * @param {Array<RawBlock>} blocks
 */
function printBlockWarnings(blocks) {
    // todo warn if listing block contains children
    // todo warn if code block contains children
}

export default {
    mountToDocumentBody: mountWebPageRendererApp,
    api,
};
