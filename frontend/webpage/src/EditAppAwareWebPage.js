import {CHILDREN_START, CHILDREN_END} from '../../edit-app/src/block/dom-commons.js';
import ReRenderer, {findCommentR, getBlockEl} from './ReRenderer.js';

class EditAppAwareWebPage {
    // data; // public
    // reRenderer; // public
    // baseUrl;
    // currentlyHoveredRootEl;
    // isLocalLink;
    // tempStyleOverrideNames;
    // tempStyleOverrideElsRemoveTimeouts;
    // onStylesUpdateFn;
    /**
     * @param {CurrentPageData} dataFromBackend
     * @param {String} baseUrl e.g. '/sub-dir/' or '/' or '/sub-dir/index.php?q=/'
     */
    constructor(dataFromBackend, baseUrl) {
        this.data = dataFromBackend;
        this.reRenderer = null;
        this.baseUrl = baseUrl;
        this.currentlyHoveredRootEl = null;
        this.isLocalLink = createIsLocalLinkCheckFn();
        this.tempStyleOverrideNames = new Map;
        this.tempStyleOverrideElsRemoveTimeouts = new Map;
        this.onStylesUpdateFn = () => {};
    }
    /**
     * @param {(block: RawBlock, then: (result: BlockRendctor) => void, shouldBackendRender: Boolean = false) => void} renderBlockAndThen
     * @param {(block: RawBlock, includePrivates: Boolean = false) => {[key: String]: any;}} toTransferable
     * @param {blockTreeUtils} blockTreeUtils
     */
    init(renderBlockAndThen, toTransferable, blockTreeUtils) {
        this.reRenderer = new ReRenderer(renderBlockAndThen, toTransferable, blockTreeUtils);
    }
    /**
     * @returns {Array<HTMLElement}
     * @access public
     */
    scanBlockElements() {
        this.deletedInnerContentStorage = new Map;
        this.currentlyHoveredBlockEl = null;
        this.revertSwapStacks = new Map;
        return Array.from(document.body.querySelectorAll('[data-block-type]'));
    }
    /**
     * Adds <!-- children-start|end --> comments to document.body.
     *
     * @param {RawBlock} lastBlock
     * @access public
     */
    addRootBoundingEls(lastBlock) {
        const rootEl = document.body;
        rootEl.insertBefore(document.createComment(CHILDREN_START), rootEl.firstChild);
        const lastEl = lastBlock.type !== 'GlobalBlockReference' ? getBlockEl(lastBlock.id, rootEl)
            : findCommentR(rootEl, ` block-end ${lastBlock.id} `);
        const nextOfLast = lastEl.nextSibling;
        if (nextOfLast) nextOfLast.parentElement.insertBefore(document.createComment(CHILDREN_END), nextOfLast);
        else lastEl.parentElement.appendChild(document.createComment(CHILDREN_END));
    }
    /**
     * @param {EditAwareWebPageEventHandlers} handlers
     * @access public
     */
    registerEventHandlers(handlers) {
        if (this.handlers) return;
        this.handlers = handlers;
        //
        let isDown = false;
        let lastDownLink = null;
        let lastDownLinkAlreadyHandled = false;
        document.body.addEventListener('mousedown', e => {
            if (!(this.currentlyHoveredBlockEl || this.isMouseListenersDisabled)) return;
            isDown = true;
            const a = e.button !== 0 ? null : e.target.nodeName === 'A' ? e.target : e.target.closest('a');
            if (!a) return;
            lastDownLink = a;
            lastDownLinkAlreadyHandled = false;
            setTimeout(() => {
                if (isDown && e.button === 0) {
                    lastDownLinkAlreadyHandled = true;
                    this.handlers.onClicked(this.currentlyHoveredBlockEl);
                }
            }, 80);
        });
        document.body.addEventListener('click', e => {
            const currentBlock = this.currentlyHoveredBlockEl;
            isDown = false;
            if (!lastDownLink) {
                if (this.isMouseListenersDisabled) { this.handlers.onClicked(currentBlock); return; }
                const b = e.button !== 0 ? null : e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button');
                if (b) e.preventDefault();
                this.handlers.onClicked(currentBlock);
            } else {
                e.preventDefault();
                if (!lastDownLinkAlreadyHandled) {
                    this.handlers.onClicked(null, lastDownLink);
                    this.doFollowLink(lastDownLink);
                }
                lastDownLink = null;
            }
        });
        //
        document.body.addEventListener('mouseover', e => {
            if (this.isMouseListenersDisabled) return;
            //
            let targ;
            if (this.currentlyHoveredBlockEl) {
                targ = e.target;
            } else {
                targ = e.target.closest('[data-block-type]');
                if (!targ) return;
            }
            //
            if (this.currentlyHoveredBlockEl) {
                const hasBeenReplacedByPropUpdate = !document.body.contains(this.currentlyHoveredBlockEl);
                if (hasBeenReplacedByPropUpdate) // @see ReRenderer.handleFastChangeEvent() ('theBlockTree/updatePropsOf')
                    this.currentlyHoveredBlockEl = getBlockEl(this.currentlyHoveredBlockEl.getAttribute('data-block'));
                //
                const b = e.target.getAttribute('data-block-type') ? e.target : e.target.closest('[data-block-type]');
                if (this.currentlyHoveredBlockEl.contains(b) && this.currentlyHoveredBlockEl !== b) {
                    this.handlers.onHoverEnded(this.currentlyHoveredBlockEl);
                    this.currentlyHoveredBlockEl = b;
                    this.handlers.onHoverStarted(this.currentlyHoveredBlockEl, this.currentlyHoveredBlockEl.getBoundingClientRect());
                }
            } else {
                if (!targ.getAttribute('data-block-type')) return;
                this.currentlyHoveredBlockEl = targ;
                this.handlers.onHoverStarted(this.currentlyHoveredBlockEl, this.currentlyHoveredBlockEl.getBoundingClientRect());
            }
        }, true);
        //
        document.body.addEventListener('mouseleave', e => {
            if (this.isMouseListenersDisabled) return;
            //
            if (this.currentlyHoveredBlockEl) {
                if (e.target === this.currentlyHoveredBlockEl) {
                    this.handlers.onHoverEnded(this.currentlyHoveredBlockEl);
                    this.currentlyHoveredBlockEl = null;
                }
            }
        }, true);
        //
        window.addEventListener('resize', () => {
            this.onStylesUpdateFn();
        });
    }
    /**
     * @returns {(state: {themeStyles: Array<ThemeStyle>; [key: String]: any;}, eventInfo: ['themeStyles/addStyle'|'themeStyles/removeStyle'|'themeStyles/addUnitTo'|'themeStyles/removeUnitFrom', [String]|[ThemeStyle, String], Object]) => void}
     * @access public
     */
    createThemeStylesChangeListener() {
        const upsertInlineStyle = (blockTypeName, style) => {
            const css = style.units.map(({generatedCss}) => generatedCss).join('\n');
            const pcs = blockTypeName !== '_body_' ? [] : css.split('/* hoisted decls ends */');
            const [hoisted, css2] = pcs.length < 2 ? ['', css] : [`${pcs[0]}/* hoisted decls ends */`, pcs[1]];
            const layerName = blockTypeName !== '_body_' ? 'units' : 'body-unit';
            const wrapped = hoisted + (css2 ? `@layer ${layerName} { ${css2} }` : '/* - */');
            const node = document.head.querySelector(`style[data-style-units-for="${blockTypeName}"]`);
            if (node) {
                node.innerHTML = wrapped;
            } else {
                const node = document.createElement('style');
                node.setAttribute('data-style-units-for', blockTypeName);
                node.innerHTML = wrapped;
                document.head.appendChild(node);
            }
        };
        return ({themeStyles}, [event, data]) => {
            if (event === 'themeStyles/updateUnitOf' || event === 'themeStyles/addUnitTo' || event === 'themeStyles/removeUnitFrom') {
                const blockTypeName = data[0]; // data: [String, String, {[key: String]: String;}]|[String]
                const style = themeStyles.find(s => s.blockTypeName === blockTypeName);
                upsertInlineStyle(blockTypeName, style);
            } else if (event === 'themeStyles/addStyle') {
                const {blockTypeName} = data[0]; // data: [ThemeStyle]
                upsertInlineStyle(blockTypeName, data[0]);
            } else if (event === 'themeStyles/removeStyle') {
                const blockTypeName = data[0]; // data: [String]
                const node = document.head.querySelector(`style[data-style-units-for="${blockTypeName}"]`);
                node.parentElement.removeChild(node);
            } else return;
            this.onStylesUpdateFn();
        };
    }
    /**
     * @param {Boolean} isDisabled
     * @access public
     */
    setIsMouseListenersDisabled(isDisabled) {
        this.isMouseListenersDisabled = isDisabled;
    }
    /**
     * @param {String} selector Example '.j-Text-unit-6' or '[data-block="-NGLsOGlKc3qw7kCRSOu"]'
     * @param {String} varName Example 'textColor'
     * @param {String|() => String} varValue Example '#f5f5f5' or () => 'text-align: right;'
     * @param {'color'} valueType
     * @access public
     */
    fastOverrideStyleUnitVar(selector, varName, varValue, valueType) {
        if (valueType !== 'color') throw new Error();
        //
        let el;
        if (!this.tempStyleOverrideNames.has(selector)) {
            el = document.createElement('style');
            el.setAttribute('data-temp-overrides-for', selector);
            document.head.appendChild(el);
            this.tempStyleOverrideNames.set(selector, 1);
        } else {
            el = document.head.querySelector(`[data-temp-overrides-for='${selector}']`);
        }
        //
        el.innerHTML = `${selector} { ${typeof varValue === 'string' ? `--${varName}: ${varValue};` : varValue()} }`;
        //
        const timeoutId = this.tempStyleOverrideElsRemoveTimeouts.get(selector);
        if (timeoutId) clearTimeout(timeoutId);
        this.tempStyleOverrideElsRemoveTimeouts.set(selector, setTimeout(() => {
            document.head.removeChild(document.head.querySelector(`[data-temp-overrides-for='${selector}']`));
            this.tempStyleOverrideNames.delete(selector);
        }, 2000));
    }
    /**
     * @param {String} varName
     * @param {RawCssValue} to
     * @access public
     */
    setCssVarValue(varName, {type, value}) {
        if (!isValidIdentifier(varName))
            throw new Error(`\`${varName}\` is not valid var name`);
        if (type !== 'color')
            throw new Error('Not implemented yet');
        document.documentElement.style.setProperty(`--${varName}`, `#${value.join('')}`);
    }
    /**
     * @param {String} blockId
     * @returns {HTMLElement|null}
     * @access public
     */
    getBlockEl(blockId) {
        return getBlockEl(blockId);
    }
    /**
     * @param {fn: () => void} fn
     * @access public
     */
    setOnReRenderOrUpdateStyles(fn) {
        this.onStylesUpdateFn = fn;
        this.reRenderer.setOnReRender(fn);
    }
    /**
     * @param {RawBlock} block
     * @returns {String|undefined}
     * @access private
     */
    getAndWipeStoredInnerContent(block) {
        const cached = this.deletedInnerContentStorage.get(block.id);
        if (!cached) return null;
        this.deletedInnerContentStorage.delete(block.id);
        return cached;
    }
    /**
     * @param {HTMLAnchorElement} el
     * @access private
     */
    doFollowLink(el) {
        if (this.isLocalLink(el)) {
            const noOrigin = el.href.substring(el.origin.length); // http://domain.com/foo -> /foo
                                                                  // http://domain.com/foo/index.php?q=/foo -> /foo/index.php?q=/foo
            const noBase = `/${noOrigin.substring(this.baseUrl.length)}`; // /foo -> /foo
                                                                          // /sub-dir/foo -> /foo
                                                                          // /index.php?q=/foo -> /foo
                                                                          // /sub-dir/index.php?q=/foo -> /foo
            window.parent.myRoute(noBase.split('#')[0]);
        }
    }
}

/**
 * https://stackoverflow.com/a/2911045
 *
 * @param {Location} location = window.location
 * @returns {(link: HTMLAnchorElement) => Boolean}
 */
function createIsLocalLinkCheckFn(location = window.location) {
    const host = location.hostname;
    return a => a.hostname === host || !a.hostname.length;
}

/**
 * @param {String} str
 * @returns {Boolean}
 */
function isValidIdentifier(str) {
    return /^[a-zA-Z_]{1}\w*$/.test(str);
}

export default EditAppAwareWebPage;
