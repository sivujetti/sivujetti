import {
    __,
    api,
    signals,
    urlUtils,
} from '../../sivujetti-commons-unified.js';
import {historyInstance, isMainColumnViewUrl} from './MainColumnViews.jsx';

const broadcastInitialStateToListeners = true;

const TITLE_LABEL_HEIGHT = 18; // at least

class WebPagePreviewApp extends preact.Component {
    // currentIframeIsLoading;
    // currentlyLoadedUrl;
    // messageChannel;
    // highlightRectEl;
    /**
     * @returns {HTMLIFrameElement}
     * @access public
     */
    getEl() {
        return document.body.querySelector('.site-preview-iframe');
    }
    /**
     * @param {() => any} fn
     * @access public
     */
    onReady(fn) {
        if (!this.currentIframeIsLoading)
            fn();
        else {
            const once = signals.on('webpage-preview-iframe-loaded', () => {
                fn();
                once();
            });
        }
    }
    /**
     * @param {RawBlock} block
     * @param {'web-page'|'block-tree'} origin
     * @param {DOMRect} rect = null
     * @access public
     */
    highlightBlock(block, origin = 'block-tree', rect = null) {
        //
    }
    /**
     * @param {String} blockId
     * @access public
     */
    unHighlightBlock(/*blockId*/) {
        this.doHideHighlightRect();
    }
    /**
     * @param {Number} elIdx
     * @param {String} textBlockId
     * @access public
     */
    highlightTextBlockChildEl(elIdx, textBlockBlockId) {
        //
    }
    /**
     * @access public
     */
    unHighlightTextBlockChildEl() {
        //
    }
    /**
     * @param {RawBlock} block
     * @returns {Boolean} didScroll
     * @access public
     */
    scrollToBlock(block) {
        //
    }
    /**
     * @param {Number} childElemIdx
     * @param {String} textBlockId
     * @access public
     */
    scrollToTextBlockChildEl(childElemIdx, textBlockBlockId) {
        //
    }
    /**
     * @param {[String, String, String, String, String]} allMediaScopesCss
     * @access public
     */
    updateCss(allMediaScopesCss) {
        //
    }
    /**
     * @param {String} blockId
     * @param {mediaScope} mediaScopeId
     * @param {String} cssPropandval
     * @access public
     */
    updateCssFast(blockId, mediaScopeId, cssPropandval) {
        //
    }
    /**
     * @param {String} css
     * @param {mediaScipe} mediaScopeId
     */
    updateMediaCss(css, mediaScopeId) {
        //
    }
    /**
     * @param {Array<RawBlock>} theTree
     * @access public
     */
    reRenderAllBlocks(theTree) {
        //
    }
    /**
     * @param {RawBlock} block
     * @param {Array<RawBlock>} theTree
     * @access public
     */
    reRenderBlock(block, theTree) {
        //
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.highlightRectEl = this.props.highlightRectEl;

        // Initial load: load current url to iframe
        const initialUrl = this.props.urlToLoad === '@currentUrl' ? historyInstance.getCurrentLocation().pathname : this.props.urlToLoad;
        this.setOrReplacePreviewIframeUrl(initialUrl);

        // Start listening url changes, load new urls as they come
        historyInstance.listen(({pathname}) => {
            if (this.state.url !== pathname)
                this.setOrReplacePreviewIframeUrl(pathname);
        });
    }
    /**
     * @param {{urlToLoad: '@currentUrl'|String;}} _
     * @access protected
     */
    render(_, {url}) {
        if (!url) // isMainColumnViewUrl() === true, no need to load anything to the iframe
            return;
        return <div ref={ el => {
            const iframe = el?.querySelector('iframe');
            if (iframe && !this.currentIframeIsLoading) {
                this.currentIframeIsLoading = true;
                if (this.currentlyLoadedUrl)
                    api.saveButton.getInstance().invalidateAll();
                iframe.addEventListener('load', () => {
                    // Listen for messages from ReRenderingWebPage
                    // See also https://github.com/mdn/dom-examples/blob/main/channel-messaging-multimessage/index.html
                    this.messageChannel.port1.onmessage = e => {
                        if (e.data[0] === 'hereIsPageDataBundle') {
                            broadcastCurrentPageData(e);
                        } else if (e.data[0] === 'onBlockHoverStarted') {
                            //
                        } else if (e.data[0] === 'onBlockHoverEnded') {
                            //
                        } else if (e.data[0] === 'onTextBlockChildElHoverStarted') {
                            //
                        } else if (e.data[0] === 'onTextBlockChildElHoverEnded') {
                            //
                        } else if (e.data[0] === 'onClicked') {
                            //
                        }
                    };
                    // Transfer port2 to the iframe (that sends the 'hereIsPageDataBundle')
                    iframe.contentWindow.postMessage(
                        ['establishLinkAndGetPageDataBundle'],
                        window.location.origin,
                        [this.messageChannel.port2]
                    );
                    this.currentIframeIsLoading = false;
                    this.currentlyLoadedUrl = url;
                });
            }
        } } dangerouslySetInnerHTML={ // Use this to force preact to recreate the iframe element instead of reusing the previous
            {__html: `<iframe src="${url}" class="site-preview-iframe"></iframe>`}
        }></div>;
    }
    /**
     * @param {String} url Example: '/sivujetti/index.php?q=/api/_placeholder-page/Pages/1'
     * @access private
     */
    setOrReplacePreviewIframeUrl(url) {
        if (url === '/pages/create') {
            // todo
        } else if (url.startsWith('/pages/') && url.endsWith('/duplicate')) {
            // todo
        } else if (url === '/page-types/create') {
            // todo
        } else if (!isMainColumnViewUrl(url)) {
            const urlBaked = urlUtils.makeUrl(`${url}?in-edit=1`);
            this.doSetOrReplaceIframeUrl(urlBaked);
        }
    }
    /**
     * @param {String} url Example: '/sivujetti/index.php?q=/api/_placeholder-page/Pages/1'
     * @access private
     */
    doSetOrReplaceIframeUrl(url) {
        if (this.messageChannel)
            this.messageChannel = null;
        this.messageChannel = new MessageChannel;
        this.setState({url});
    }
    /**
     * @param {DOMRect} rect
     * @param {String} title
     * @access private
     */
    doShowHighlightRect(rect, title) {
        const {highlightRectEl} = this;
        highlightRectEl.style.cssText = [
            'width:', rect.width, 'px;',
            'height:', rect.height, 'px;',
            'top:', rect.top, 'px;',
            'left: calc(var(--menuColumnWidthComputed) + ', rect.left, 'px)'
        ].join('');
        if (rect.top < -TITLE_LABEL_HEIGHT)
            highlightRectEl.setAttribute('data-label-position', 'bottom-inside');
        else if (rect.top > TITLE_LABEL_HEIGHT)
            highlightRectEl.setAttribute('data-label-position', 'top-outside');
        else
            highlightRectEl.setAttribute('data-label-position', 'top-inside');
        highlightRectEl.setAttribute('data-title', title);
    }
    /**
     * @access private
     */
    doHideHighlightRect() {
        const {highlightRectEl} = this;
        highlightRectEl.setAttribute('data-title', '');
        highlightRectEl.style.cssText = '';
    }
}

let counter = -1;

/**
 * @param {Event & {data: [any, CurrentPageData]}} e
 */
function broadcastCurrentPageData(e) {
    const [_, dataBundle] = e.data;
    const blocks = getAndInvalidate(dataBundle.page, 'blocks');
    const stylesBundle = getAndInvalidate(dataBundle.theme, 'styles');

    signals.emit('webpage-preview-iframe-before-loaded');

    const saveButton = api.saveButton.getInstance();
    const withId = {...stylesBundle[0], id: counter + 1};
    saveButton.initChannel('stylesBundle', withId, broadcastInitialStateToListeners);
    saveButton.initChannel('theBlockTree', blocks, broadcastInitialStateToListeners);
    saveButton.initChannel('currentPageDataBundle', dataBundle);

    signals.emit('webpage-preview-iframe-loaded');
}

/**
 * @param {Object} entity
 * @param {String} prop
 * @param {String} prop 
 * @returns {any}
 */
function getAndInvalidate(entity, prop, keepDebugEntry = false) {
    const out = entity[prop];
    if (keepDebugEntry) entity[`__${prop}DebugOnly`] = entity[prop];
    delete entity[prop];
    return out;
}

/**
 * @param {String} nodeName Example 'P', 'UL', 'BLOCKQUOTE'
 * @returns {String} Example 'Paragraph', 'Unordered list', 'Blockquote'
 */
function nodeNameToFriendly(nodeName) {
    const pair = {
        'P':          ['Paragraph',      ''],
        'H1':         ['Heading',        ' 1'],
        'H2':         ['Heading',        ' 2'],
        'H3':         ['Heading',        ' 3'],
        'H4':         ['Heading',        ' 4'],
        'H5':         ['Heading',        ' 5'],
        'H6':         ['Heading',        ' 6'],
        'UL':         ['Unordered list', ''],
        'OL':         ['Ordered list',   ''],
        'BLOCKQUOTE': ['Blockquote',     ''],
    }[nodeName];
    return pair ? `${__(pair[0])}${pair[1]}` : `<${nodeName.toLowerCase()}>`;
}

export default WebPagePreviewApp;
