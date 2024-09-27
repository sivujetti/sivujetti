import {
    __,
    api,
    blockTreeUtils,
    events,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import {isMetaBlock} from '../includes/block/utils.js';
import globalData from '../includes/globalData.js';
import {createTrier} from '../includes/utils.js';
import {getBlockEl, getMetaKey} from '../../shared-inline.js';
import {historyInstance, isMainColumnViewUrl} from './MainColumnViews.jsx';

const broadcastInitialStateToListeners = true;

const TITLE_LABEL_HEIGHT = 18; // at least

class WebPagePreviewApp extends preact.Component {
    // currentIframeIsLoading;
    // currentlyLoadedUrl;
    // messageChannel;
    // highlightRectEls;
    // urlFromRouter;
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
            const once = events.on('webpage-preview-iframe-loaded', () => {
                fn();
                once();
            });
        }
    }
    /**
     * @param {Block} block
     * @param {'web-page'|'block-tree'} origin
     * @param {DOMRect} rect = null
     * @access public
     */
    highlightBlock(block, origin = 'block-tree', rect = null) {
        if (isMetaBlock(block)) return;
        const title = (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + (block.title || __(block.type));
        const foundRect = rect || this.getBlockEl(block.id)?.getBoundingClientRect();
        if (!foundRect) return;
        this.doShowHighlightRect(foundRect, title, 0);
        events.emit('highlight-rect-revealed', block.id, origin);
    }
    /**
     * @param {string} blockId
     * @access public
     */
    unHighlightBlock(/*blockId*/) {
        this.doHideHighlightRect(0);
    }
    /**
     * @param {number} elIdx
     * @param {string} textBlockId
     * @access public
     */
    highlightTextBlockChildEl(elIdx, textBlockBlockId) {
        const blockEl = this.getBlockEl(textBlockBlockId);
        const childEl = blockEl.children[elIdx];
        if (!childEl) return;
        const rect = childEl.getBoundingClientRect();
        this.doShowHighlightRect(rect, `${__('Text')} > ${nodeNameToFriendly(childEl.nodeName)}`, 1);
        if (elIdx === 0 && blockEl.children.length === 1)
            this.highlightRectEls[0].setAttribute('data-has-sole-sub-rect', '1');
    }
    /**
     * @access public
     */
    unHighlightTextBlockChildEl() {
        this.doHideHighlightRect(1);
    }
    /**
     * @param {Block} block
     * @returns {boolean} didScroll
     * @access public
     */
    scrollToBlock(block, win = this.getEl().contentWindow, behavior = 'smooth') {
        if (isMetaBlock(block)) return;
        const blockEl = this.getBlockEl(block.id, this.getEl().contentDocument.body);
        if (!blockEl) return false;
        return this.scrollToBlockEl(blockEl, win, behavior);
    }
    /**
     * @param {Block} block
     * @access public
     */
    scrollToBlockAsync(block, win = this.getEl().contentWindow, behavior = 'smooth') {
        if (isMetaBlock(block)) return;
        const body = this.getEl().contentDocument.body;
        createTrier(() => {
            const el = this.getBlockEl(block.id, body);
            if (!el) return false;
            this.scrollToBlockEl(el, win, behavior);
            return true;
        }, 100, 30, '')();
    }
    /**
     * @param {number} childElemIdx
     * @param {string} textBlockId
     * @access public
     */
    scrollToTextBlockChildEl(childElemIdx, textBlockBlockId) {
        const body = this.getEl().contentDocument.body;
        const blockEl = getBlockEl(textBlockBlockId, body);
        const child = blockEl.children[childElemIdx];
        const rect = child.getBoundingClientRect();
        const win = this.getEl().contentWindow;
        win.scrollTo({
            top: rect.top + win.scrollY - 30,
            behavior: 'auto',
        });
    }
    /**
     * @param {string} compiledCss
     * @access public
     */
    updateCss(compiledCss) {
        this.sendMessageToReRenderer(['updateBlocksStyles', compiledCss]);
    }
    /**
     * @param {string} blockId Examples 'uacHWbsK', '' (if `:root {...}` body style)
     * @param {string} css Examples '[data-block="uacHWbsK"] {color: #ad5f5f;}'
     * @access public
     */
    updateCssFast(blockId, css) {
        this.sendMessageToReRenderer([
            'updateBlockStyleFast',
            css,
            blockId,
        ]);
    }
    /**
     * @param {Block} block
     * @param {Array<Block>} theTree
     * @access public
     */
    reRenderBlock(block, theTree) {
        this.sendMessageToReRenderer(['reRenderBlock', block, theTree]);
    }
    /**
     * @param {Array<Block>} theTree
     * @access public
     */
    reRenderAllBlocks(theTree) {
        this.sendMessageToReRenderer(['reRenderAllBlocks', theTree]);
    }
    /**
     * @param {[string, ...any]} args
     * @access public
     */
    sendMessageToReRenderer(args) {
        this.messageChannel?.port1?.postMessage(args);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.highlightRectEls = this.props.highlightRectEls;

        // Initial load: load current url to iframe
        const initialUrl = this.props.urlToLoad === '@currentUrl'
            ? getFullUrl(historyInstance.getCurrentLocation())
            : this.props.urlToLoad;
        this.setOrReplacePreviewIframeUrl(initialUrl);

        // Start listening url changes, load new urls as they come
        historyInstance.listen(path => {
            const newUrl = getFullUrl(path);
            if (!isMainColumnViewUrl(newUrl) && this.urlFromRouter !== newUrl)
                this.setOrReplacePreviewIframeUrl(newUrl);
        });

        const metaKey = getMetaKey();
        const emitMetaKeyIsDown = isDown => {
            this.sendMessageToReRenderer(['handleMetaKeyPressedOrReleased', isDown]);
        };
        window.addEventListener('keydown', e => {
            if (e.key === metaKey) emitMetaKeyIsDown(true);
        });
        window.addEventListener('keyup', e => {
            if (e.key === metaKey) emitMetaKeyIsDown(false);
        });
    }
    /**
     * @param {{urlToLoad: '@currentUrl'|string;}} _
     * @access protected
     */
    render(_, {url}) {
        if (!url) // isMainColumnViewUrl() === true, no need to load anything to the iframe
            return;
        return <div ref={ el => {
            const iframe = el?.querySelector('iframe');
            if (iframe && !this.currentIframeIsLoading) {
                this.currentIframeIsLoading = true;
                // Clear _all_ data from current savebutton
                if (this.currentlyLoadedUrl) {
                    api.saveButton.getInstance().invalidateAll();
                }

                iframe.addEventListener('load', () => {
                    // Listen for messages from ReRenderingWebPage
                    // See also https://github.com/mdn/dom-examples/blob/main/channel-messaging-multimessage/index.html
                    this.messageChannel.port1.onmessage = e => {
                        if (e.data[0] === 'hereIsPageDataBundle') {
                            broadcastCurrentPageData(e);
                        } else if (e.data[0] === 'onBlockHoverStarted') {
                            const [_, blockId, blockRect] = e.data; // [_, string, DOMRect]
                            const block = blockRect ? blockTreeUtils.findBlockMultiTree(blockId, api.saveButton.getInstance().getChannelState('theBlockTree'))[0] : null;
                            if (block) this.highlightBlock(block, 'web-page', blockRect);
                        } else if (e.data[0] === 'onBlockHoverEnded') {
                            const [_, blockId] = e.data; // [_, string]
                            this.doHideHighlightRect(0);
                            events.emit('highlight-rect-removed', blockId);
                        } else if (e.data[0] === 'onTextBlockChildElHoverStarted') {
                            const [_, childIdx, textBlockBlockId] = e.data; // [_, number, string]
                            this.highlightTextBlockChildEl(childIdx, textBlockBlockId);
                            events.emit('web-page-text-block-child-el-hover-started', childIdx, textBlockBlockId);
                        } else if (e.data[0] === 'onTextBlockChildElHoverEnded') {
                            this.unHighlightTextBlockChildEl();
                            events.emit('web-page-text-block-child-el-hover-ended');
                        } else if (e.data[0] === 'onClicked') {
                            const [_, blockId] = e.data; // [_, string|null]
                            if (blockId)
                                events.emit('web-page-click-received', blockId);
                        }
                    };
                    // Transfer port2 to the iframe (that sends the 'hereIsPageDataBundle')
                    iframe.contentWindow.postMessage(
                        ['establishLinkAndGetPageDataBundle'],
                        window.location.origin,
                        [this.messageChannel.port2]
                    );
                    //
                    const win = iframe.contentWindow;
                    win.addEventListener('mousedown', e => {
                        if (
                            e.button === 0 &&
                            !iframe.contentDocument.hasFocus() &&
                            (e.target.nodeName === 'A' ? true : e.target.closest('a'))
                        ) {
                            win.focus();
                        }
                    }, false);
                    //
                    this.currentIframeIsLoading = false;
                    this.currentlyLoadedUrl = url;
                });
            }
        } } dangerouslySetInnerHTML={ // Use this to force preact to recreate the iframe element instead of reusing the previous
            {__html: `<iframe src="${url}" class="site-preview-iframe"></iframe>`}
        }></div>;
    }
    /**
     * @param {string} urlFromRouter Examples: '/services', '/services#ref-1'
     * @access private
     */
    setOrReplacePreviewIframeUrl(urlFromRouter) {
        this.urlFromRouter = urlFromRouter;

        const url = createUrlForIframe(urlFromRouter);
        if (!url) return;

        if (this.messageChannel) this.messageChannel = null;
        this.messageChannel = new MessageChannel;
        this.setState({url});
    }
    /**
     * @param {DOMRect} rect
     * @param {string} title
     * @param {number} rectIdx
     * @access private
     */
    doShowHighlightRect(rect, title, rectIdx) {
        const el = this.highlightRectEls[rectIdx];
        el.style.cssText = [
            'width:', rect.width, 'px;',
            'height:', rect.height, 'px;',
            'top:', rect.top, 'px;',
            'left: calc(var(--menu-column-width-computed) + ', rect.left, 'px)'
        ].join('');
        if (rect.top < -TITLE_LABEL_HEIGHT)
            el.setAttribute('data-label-position', 'bottom-inside');
        else if (rect.top > TITLE_LABEL_HEIGHT)
            el.setAttribute('data-label-position', 'top-outside');
        else
            el.setAttribute('data-label-position', 'top-inside');
        el.setAttribute('data-title', title);
    }
    /**
     * @param {number} rectIdx
     * @access private
     */
    doHideHighlightRect(rectIdx) {
        const el = this.highlightRectEls[rectIdx];
        el.setAttribute('data-title', '');
        if (rectIdx > 0)
            this.highlightRectEls[0].removeAttribute('data-has-sole-sub-rect');
        el.style.cssText = '';
    }
    /**
     * @param {string} blockId
     * @returns {HTMLElement|null}
     * @access private
     */
    getBlockEl(blockId) {
        const iframe = document.querySelector('.site-preview-iframe');
        return getBlockEl(blockId, iframe.contentDocument);
    }
    /**
     * @param {HTMLElement} blockEl
     * @param {Window} win
     * @param {ScrollBehavior} behavior
     * @returns {boolean} didScroll
     * @access private
     */
    scrollToBlockEl(blockEl, win, behavior) {
        const inPageElRect = blockEl.getBoundingClientRect();
        const inPageElTop = inPageElRect.top;
        const elBottom = inPageElRect.bottom;
        const quarterVisible = win.innerHeight / 4;
        if (inPageElTop <= 0 && elBottom <= (quarterVisible * 3) ||
            elBottom < 0 ||
            inPageElTop > quarterVisible) {
            win.scrollTo({
                top: inPageElTop + win.scrollY - 40,
                behavior,
            });
            return true;
        }
        return false;
    }
}

/**
 * @param {string} url
 * @returns {string}
 */
function createUrlForIframe(url) {
    const [pathname, hash] = url.split('#');
    const pcs = pathname.split('/');
    // '/pages/create/:pageTypeName?/:layoutId?'
    if (pcs[1] === 'pages' && pcs[2] === 'create') {
        const pageTypeName = pcs[3] || 'Pages';
        const layoutId = pcs[4] || '1';
        return urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`);
    // '/pages/:pageSlug/duplicate'
    } else if (pcs[1] === 'pages' && pcs[3] === 'duplicate') {
        const pageTypeName = 'Pages';
        const layoutId = '1';
        return urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}` +
            `?duplicate=${encodeURIComponent(pcs[2])}`);
    // '/page-types/create'
    } else if (pcs[1] === 'page-types' && pcs[2] === 'create') {
        const pageTypeName = 'draft';
        const layoutId = '1';
        return urlUtils.makeUrl(`/api/_placeholder-page/${pageTypeName}/${layoutId}`);
    // '/some-page', '/some-page#anchor
    } else if (!isMainColumnViewUrl(pathname)) {
        // ?, also transform/normalize (? -> &, # -> ?)
        return urlUtils.makeUrl(`${pathname}?in-edit=1${!hash ? '' : `#${hash}`}`);
    }
    return null;
}

let counter = -1;

/**
 * @param {Event & {data: [any, CurrentPageData]}} e
 */
function broadcastCurrentPageData(e) {
    const [_, dataBundle] = e.data;
    /** @type {Array<Block>} */
    const blocks = getAndInvalidate(dataBundle.page, 'blocks');
    /** @type {StylesBundle} */
    const stylesBundle = getAndInvalidate(dataBundle.theme, 'styles');

    events.emit('webpage-preview-iframe-before-loaded');

    const saveButton = api.saveButton.getInstance();
    const withId = {...stylesBundle, id: counter + 1};
    saveButton.initChannel('stylesBundle', withId, broadcastInitialStateToListeners);
    saveButton.initChannel('theBlockTree', blocks, broadcastInitialStateToListeners);

    globalData.initialPageBlocksStyles = dataBundle.initialPageBlocksStyles;
    globalData.theme = dataBundle.theme;
    globalData.layout = dataBundle.layout;

    saveButton.initChannel('currentPageData', dataBundle.page);
    // saveButton.initChannel('reusableBranches', ...); deferred, see ../includes/reusable-branches/repository.js
    // saveButton.initChannel('globalBlockTrees', ...); deferred, see ../includes/global-block-trees/repository.js
    // saveButton.initChannel('pageTypes', ...); deferred, see ../menu-column/page-type/PageTypeCreateState.jsx @componentWillMount

    events.emit('webpage-preview-iframe-loaded');
}

/**
 * @template {T}
 * @param {T} entity
 * @param {string} prop
 * @returns {T}
 */
function getAndInvalidate(entity, prop, keepDebugEntry = false) {
    const out = entity[prop];
    if (keepDebugEntry) entity[`__${prop}DebugOnly`] = entity[prop];
    delete entity[prop];
    return out;
}

/**
 * @param {string} nodeName Example 'P', 'UL', 'BLOCKQUOTE'
 * @returns {string} Example 'Paragraph', 'Unordered list', 'Blockquote'
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

/**
 * @param {Path} location {pathname: '/foo', hash: '#anchor', search: null}
 * @returns {string} '/foo#anchor'
 */
function getFullUrl({pathname, hash}) {
    return `${pathname}${hash || ''}`;
}

export default WebPagePreviewApp;
