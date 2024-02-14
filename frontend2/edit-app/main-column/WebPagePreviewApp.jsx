import {__} from '../../sivujetti-commons-unified.js';

class WebPagePreviewApp extends preact.Component {
    /**
     * @returns {HTMLIFrameElement}
     */
    getEl() {
        return document.body.querySelector('.site-preview-iframe');
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
    }
    /**
     * @param {{urlToLoad: '@currentUrl'|String;}} _
     * @access protected
     */
    render(_) {
        return <p>todo</p>;
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
