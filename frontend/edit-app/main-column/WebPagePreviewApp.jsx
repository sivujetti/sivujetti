import {
    __,
    api,
    blockTreeUtils,
    events,
    objectUtils,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import {isMetaBlock} from '../includes/block/utils.js';
import globalData from '../includes/globalData.js';
import {createTrier} from '../includes/utils.js';
import {cloneDeep, getMetaKey, getBlockEl, traverseRecursively} from '../../shared-inline.js';
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
     * @param {number} nthOfId
     * @param {DOMRect} rect = null
     * @access public
     */
    highlightBlock(block, nthOfId, rect = null) {
        if (isMetaBlock(block)) return;
        const title = (block.type !== 'PageInfo' ? '' : `${__('Page title')}: `) + (block.title || __(block.type));
        const foundRect = rect || this.getBlockEl(block.id, nthOfId)?.getBoundingClientRect();
        if (!foundRect) return;
        this.doShowHighlightRect(foundRect, title, 0);
        const origin = rect ? 'web-page' : 'block-tree';
        events.emit('highlight-rect-revealed', block.id, nthOfId, origin);
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
     * @param {string} textBlockBlockId
     * @param {number} nthOfTextBlockBlockId
     * @access public
     */
    highlightTextBlockChildEl(elIdx, textBlockBlockId, nthOfTextBlockBlockId) {
        const blockEl = this.getBlockEl(textBlockBlockId, nthOfTextBlockBlockId);
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
     * @param {number} nthOfId
     * @returns {boolean} didScroll
     * @access public
     */
    scrollToBlock(block, nthOfId, win = this.getEl().contentWindow, behavior = 'smooth') {
        if (isMetaBlock(block)) return;
        const blockEl = this.getBlockEl(block.id, nthOfId);
        if (!blockEl) return false;
        return this.scrollToBlockEl(blockEl, win, behavior);
    }
    /**
     * @param {Block} block
     * @param {number} nthOfId
     * @access public
     */
    scrollToBlockAsync(block, nthOfId, win = this.getEl().contentWindow, behavior = 'smooth') {
        if (isMetaBlock(block)) return;
        createTrier(() => {
            const el = this.getBlockEl(block.id, nthOfId);
            if (!el) return false;
            this.scrollToBlockEl(el, win, behavior);
            return true;
        }, 100, 30, '')();
    }
    /**
     * @param {number} childElemIdx
     * @param {string} textBlockId
     * @param {boolean} center = true
     * @access public
     */
    scrollToTextBlockChildEl(childElemIdx, textBlockBlockId, center = true) {
        const blockEl = this.getBlockEl(textBlockBlockId, 1);
        const child = blockEl.children[childElemIdx];
        const rect = child.getBoundingClientRect();
        const win = this.getEl().contentWindow;
        if (center) {
            scrollToCenterOfIfNeeded(rect, win, 'auto');
        } else {
            win.scrollTo({
                top: rect.top + win.scrollY - 30,
                behavior: 'auto',
            });
        }
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
     * @param {Array<Block>} theTree
     * @param {Array<GlobalBlockTree>} detachedTrees
     * @access public
     */
    reRenderAllBlocks(theTree, detachedTrees) {
        this.sendMessageToReRenderer(['reRenderAllBlocks', attachGlobalBlockTreesAndClone(theTree, detachedTrees)]);
    }
    /**
     * @param {Array<Block>} theTree
     * @param {Array<GlobalBlockTree>} detachedTrees
     * @param {Block} block = null
     * @access public
     */
    reRenderBlock(theTree, detachedTrees, block = null) {
        this.sendMessageToReRenderer(['reRenderBlock', block, attachGlobalBlockTreesAndClone(theTree, detachedTrees)]);
    }
    /**
     * @param {[string, ...any]} args
     * @access public
     */
    sendMessageToReRenderer(args) {
        this.messageChannel?.port1?.postMessage(args);
    }
    /**
     * @param {[string, ...any]} args
     * @returns {Promise<any>} Data returned from the ReRenderer
     * @access public
     */
    sendMessageToReRendererWithReturn(args) {
        return new Promise(resolve => {
            const fn = e => {
                if (e.data[0] === `${args[0]}-return`) {
                    this.messageChannel?.port1?.removeEventListener('message', fn);
                    resolve(e.data);
                }
            };
            this.messageChannel?.port1?.addEventListener('message', fn);
            this.messageChannel?.port1?.postMessage(args);
        });
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
            if (!isMainColumnViewUrl(newUrl) && this.urlFromRouter !== newUrl) {
                if (isEditAppNonDefaultStateUrl(newUrl) || !isEditAppNonDefaultStateUrl(this.urlFromRouter))
                    this.setOrReplacePreviewIframeUrl(newUrl, null);
                else
                    this.sendMessageToReRendererWithReturn(['getMouseState']).then(data => {
                        const [_, state] = data; // [_, ReRenderingWebPageMouseState]
                        this.setOrReplacePreviewIframeUrl(newUrl, state);
                    });
            }
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
                    this.messageChannel.port1.addEventListener('message', e => {
                        if (e.data[0] === 'hereIsPageDataBundle') {
                            broadcastCurrentPageData(e);
                        } else if (e.data[0] === 'onBlockHoverStarted') {
                            const [_, blockId, nthOfId, blockRect] = e.data; // [_, string, number, DOMRect]
                            const block = blockRect ? blockTreeUtils.findBlockMultiTree(blockId, api.saveButton.getInstance().getChannelState('theBlockTree'))[0] : null;
                            if (block) this.highlightBlock(block, nthOfId, blockRect);
                        } else if (e.data[0] === 'onBlockHoverEnded') {
                            const [_, blockId] = e.data; // [_, string]
                            this.doHideHighlightRect(0);
                            events.emit('highlight-rect-removed', blockId);
                        } else if (e.data[0] === 'onTextBlockChildElHoverStarted') {
                            const [_, childIdx, textBlockBlockId, nthOfTextBlockBlockId] = e.data; // [_, number, string]
                            this.highlightTextBlockChildEl(childIdx, textBlockBlockId, nthOfTextBlockBlockId);
                            events.emit('web-page-text-block-child-el-hover-started', childIdx, textBlockBlockId);
                        } else if (e.data[0] === 'onTextBlockChildElHoverEnded') {
                            this.unHighlightTextBlockChildEl();
                            events.emit('web-page-text-block-child-el-hover-ended');
                        } else if (e.data[0] === 'onClicked') {
                            const [_, blockId, nthOfId] = e.data; // [_, string|null, number|null]
                            if (blockId)
                                events.emit('web-page-click-received', blockId, nthOfId);
                        }
                    });
                    this.messageChannel.port1.start();
                    // Transfer port2 to the iframe (that sends the 'hereIsPageDataBundle')
                    iframe.contentWindow.postMessage(
                        ['establishLinkAndGetPageDataBundle', this.state.prevIframeMouseState],
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
     * @param {ReRenderingWebPageMouseState} prevIframeMouseState = null
     * @access private
     */
    setOrReplacePreviewIframeUrl(urlFromRouter, prevIframeMouseState = null) {
        this.urlFromRouter = urlFromRouter;

        const url = createUrlForIframe(urlFromRouter);
        if (!url) return;

        if (this.messageChannel) this.messageChannel = null;
        this.messageChannel = new MessageChannel;
        this.setState({url, prevIframeMouseState});
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
     * @param {number} nthOfId
     * @returns {HTMLElement|null}
     * @access private
     */
    getBlockEl(blockId, nthOfId) {
        const from = this.getEl().contentDocument.body;
        return getBlockEl(blockId, nthOfId, from);
    }
    /**
     * @param {HTMLElement} blockEl
     * @param {Window} win
     * @param {ScrollBehavior} behavior
     * @param {boolean} center = true
     * @returns {boolean} didScroll
     * @access private
     */
    scrollToBlockEl(blockEl, win, behavior, center = true) {
        const inPageElRect = blockEl.getBoundingClientRect();
        if (center)
            return scrollToCenterOfIfNeeded(inPageElRect, win, behavior);
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
 * @param {DOMRect} elRect
 * @param {Window} win
 * @param {ScrollBehavior} behavior
 * @returns {boolean} didScroll
 */
function scrollToCenterOfIfNeeded(elRect, win, behavior) {
    const {top} = elRect;
    const winQuarter = win.innerHeight / 4;
    const winCenterRectTop = winQuarter;
    const winCenterRectBottom = win.innerHeight - winQuarter * 2;
    const isInsideHalfCenter = top > winCenterRectTop && top < winCenterRectBottom;
    if (!isInsideHalfCenter) {
        const absTop = top + win.scrollY;
        win.scrollTo({
            top: absTop - window.innerHeight / 2 + 40,
            behavior,
        });
        return true;
    }
    return false;
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
    events.emit('webpage-preview-iframe-before-loaded');

    const saveButton = api.saveButton.getInstance();
    const [_, dataBundle] = e.data;

    /** @type {Array<Block>} */
    const blocks = getAndInvalidate(dataBundle.page, 'blocks');
    const detachedGbts = detachGlobalBlockTrees(blocks); // Note: mutates blocks
    saveButton.initChannel('globalBlockTrees', detachedGbts);

    /** @type {StylesBundle} */
    const stylesBundle = getAndInvalidate(dataBundle.theme, 'styles');
    saveButton.initChannel('stylesBundle', {
        ...stylesBundle,
        styleChunks: addIds(stylesBundle.styleChunks),
        id: counter + 1,
    }, broadcastInitialStateToListeners);

    saveButton.initChannel('theBlockTree', blocks, broadcastInitialStateToListeners);

    globalData.initialPageBlocksStyles = dataBundle.initialPageBlocksStyles;
    globalData.theme = dataBundle.theme;
    globalData.layout = dataBundle.layout;

    saveButton.initChannel('currentPageData', dataBundle.page);
    // saveButton.initChannel('reusableBranches', ...); deferred, see ../includes/reusable-branches/repository.js
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

/**
 * @param {string} url
 * @returns {boolean}
 */
function isEditAppNonDefaultStateUrl(url) {
    return url.startsWith('/pages/') || // '/pages/create/:pageTypeName?/:layoutId?' or '/pages/:slug/duplicate'
        url.startsWith('/page-types/create');
}

/**
 * @param {Array<Block>} blocksMut
 * @returns {Array<GlobalBlockTree>}
 */
function detachGlobalBlockTrees(blocksMut) {
    const detachTrees = (branch, gbts) => {
        traverseRecursively(branch, b => {
            if (b.type === 'GlobalBlockReference') {
                detachTrees(b.__globalBlockTree.blocks, gbts);

                if (!gbts[b.globalBlockTreeId]) {
                    gbts.set(b.globalBlockTreeId, cloneDeep(b.__globalBlockTree));
                    delete b.__globalBlockTree;
                }
            }
        });
    };
    const to = new Map;
    detachTrees(blocksMut, to);
    return [...to.values()];
}

/**
 * @param {Array<Block>} blocks
 * @param {Array<GlobalBlockTree>} gbts
 * @returns {Array<Block>}
 */
function attachGlobalBlockTreesAndClone(blocks, gbts) {
    const attachTrees = branch => traverseRecursively(branch, b => {
        if (b.type === 'GlobalBlockReference') {
            const gbt = blockTreeUtils.getTree(b.globalBlockTreeId, gbts);
            b.__globalBlockTree = gbt ? objectUtils.cloneDeep(gbt) : {id: 'failsafe', blocks: []};
            attachTrees(b.__globalBlockTree.blocks);
        }
    });
    return objectUtils.cloneDeepWithChanges(blocks, copy => {
        attachTrees(copy);
    });
}

/**
 * @param {Array<StyleChunkWithoutId>} bundle
 * @returns {Array<StyleChunk>}
 */
function addIds(styleChunks) {
    return styleChunks.map((c, i) => ({id: i + 1, ...c}));
}

export default WebPagePreviewApp;
