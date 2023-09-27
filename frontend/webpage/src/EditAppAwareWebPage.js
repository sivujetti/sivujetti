import {CHILDREN_START, CHILDREN_END, getMetaKey,
        getBlockEl, getNormalizedInitialHoverCandidate} from '../../edit-app/src/block/dom-commons.js';
import ReRenderer, {findCommentR} from './ReRenderer.js';

const useCtrlClickBasedFollowLinkLogic = true;

class EditAppAwareWebPage {
    // data; // public
    // reRenderer; // public
    // metaKeyIsPressed; // public
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
        this.metaKeyIsPressed = false;
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
     * @param {Boolean} prevInstanceMetaKeyIsPressed
     */
    init(renderBlockAndThen, toTransferable, blockTreeUtils, prevInstanceMetaKeyIsPressed) {
        this.metaKeyIsPressed = prevInstanceMetaKeyIsPressed;
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
     * @param {Signals} globalSignals
     * @access public
     */
    registerEventHandlers(handlers) {
        if (this.handlers) return;
        this.handlers = handlers;
        //
        document.body.addEventListener('mouseover', e => {
            if (this.isMouseListenersDisabled) return;
            //
            this.handleBlockMouseover(e);
            //
            this.handleTextBlockChildElMouseover(e);
        }, true);
        //
        document.body.addEventListener('mouseleave', e => {
            if (this.isMouseListenersDisabled) return;
            // Hover of inner node of text block element
            if (this.curHoveredSubEl && e.target === this.curHoveredSubEl) {
                this.handlers.onTextBlockChildElHoverEnded();
                this.curHoveredSubEl = null;
            }
            // Hover of block element
            if (this.currentlyHoveredBlockEl && e.target === this.currentlyHoveredBlockEl) {
                if (this.currentlyHoveredBlockEl.getAttribute('data-block-type') !== 'Text') this.handlers.onBlockHoverEnded(this.currentlyHoveredBlockEl);
                this.currentlyHoveredBlockEl = null;
            }
        }, true);
        //
        window.addEventListener('resize', () => {
            this.onStylesUpdateFn();
        });
        //
        if (useCtrlClickBasedFollowLinkLogic)
            this.addClickHandlersCtrlClickVersion();
        else
            this.addClickHandlersLongClickVersion();
    }
    /**
     * @param {MouseEvent} e
     * @access private
     */
    handleBlockMouseover(e) {
        let targ;
        if (this.currentlyHoveredBlockEl) {
            targ = e.target;
        } else {
            targ = e.target.closest('[data-block-type]');
            if (!targ) return;
        }
        //
        if (this.currentlyHoveredBlockEl) {
            const doShow = this.currentlyHoveredBlockEl.getAttribute('data-block-type') !== 'Text';
            const hasBeenReplacedByPropUpdate = !document.body.contains(this.currentlyHoveredBlockEl);
            if (hasBeenReplacedByPropUpdate) // @see ReRenderer.handleFastChangeEvent() ('theBlockTree/updatePropsOf')
                this.currentlyHoveredBlockEl = getBlockEl(this.currentlyHoveredBlockEl.getAttribute('data-block'));
            //
            const b = e.target.getAttribute('data-block-type') ? e.target : e.target.closest('[data-block-type]');
            if (this.currentlyHoveredBlockEl.contains(b) && this.currentlyHoveredBlockEl !== b) {
                if (doShow) this.handlers.onBlockHoverEnded(this.currentlyHoveredBlockEl);
                this.currentlyHoveredBlockEl = b;
                if (doShow) this.handlers.onBlockHoverStarted(this.currentlyHoveredBlockEl, this.currentlyHoveredBlockEl.getBoundingClientRect());
            }
        } else {
            if (!targ.getAttribute('data-block-type')) return;
            const doShow = targ.getAttribute('data-block-type') !== 'Text';
            this.currentlyHoveredBlockEl = targ;
            if (doShow) this.handlers.onBlockHoverStarted(this.currentlyHoveredBlockEl, this.currentlyHoveredBlockEl.getBoundingClientRect());
        }
    }
    /**
     * @param {MouseEvent} e
     * @access private
     */
    handleTextBlockChildElMouseover(e) {
        if (this.curHoveredSubEl) {
            const b = e.target;
            const hasChanged = (
                b !== this.curHoveredSubEl &&
                isSubHoverable(e.target, this.currentlyHoveredBlockEl)
            );
            if (hasChanged) {
                this.handlers.onTextBlockChildElHoverEnded();
                this.curHoveredSubEl = b;
                this.handlers.onTextBlockChildElHoverStarted(
                    Array.from(this.currentlyHoveredBlockEl.children).indexOf(this.curHoveredSubEl),
                    this.currentlyHoveredBlockEl.getAttribute('data-block')
                );
            }
        } else {
            if (this.currentlyHoveredBlockEl?.children?.length > 1) {
                const candidate = getNormalizedInitialHoverCandidate(e.target, this.currentlyHoveredBlockEl);
                if (isSubHoverable(candidate, this.currentlyHoveredBlockEl)) {
                    this.curHoveredSubEl = candidate;
                    this.handlers.onTextBlockChildElHoverStarted(
                        Array.from(this.currentlyHoveredBlockEl.children).indexOf(this.curHoveredSubEl),
                        this.currentlyHoveredBlockEl.getAttribute('data-block')
                    );
                }
            }
        }
    }
    /**
     * @returns {(state: {themeStyles: Array<ThemeStyle>; [key: String]: any;}, eventInfo: ['themeStyles/addStyle'|'themeStyles/removeStyle'|'themeStyles/addUnitTo'|'themeStyles/removeUnitFrom', [String]|[ThemeStyle, String], Object]) => void}
     * @access public
     */
    createThemeStylesChangeListener() {
        const upsertInlineStyle = (blockTypeName, style) => {
            const css = style.units.map(({optimizedGeneratedCss, generatedCss}) => optimizedGeneratedCss || generatedCss).join('\n');
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
     * @returns {Array<[String, (...args: any) => void]>}
     * @access public
     */
    getGlobalListenerCreateCallables() {
        return [['meta-key-pressed-or-released', isDown => {
            this.metaKeyIsPressed = isDown;
        }]];
    }
    /**
     * @param {Boolean} isDisabled
     * @access public
     */
    setIsMouseListenersDisabled(isDisabled) {
        this.isMouseListenersDisabled = isDisabled;
    }
    /**
     * @param {String} selector Example '.j-Text-unit-6'
     * @param {String} varName Example 'textColor'
     * @param {String|() => {supportingCss: String; varVal: String;}} varValue Example '#f5f5f5' or () => {supportingCss: '.j-Section-d-6:before{content:"";background-color:var(--cover_Section_u6);...}'; varVal: '#f5f5f5'}
     * @param {'color'} valueType
     * @access public
     */
    fastOverrideStyleUnitVar(selector, varName, varValue, valueType) {
        if (valueType !== 'color') throw new Error();

        const [el, attrSelector] = this.createOrGetTempStyleTag(selector, 'var-override');

        let varValueFinal;
        if (typeof varValue === 'function') {
            // #1: supporting css
            const {supportingCss, varVal} = varValue();
            const [el2, attrSelector2] = this.createOrGetTempStyleTag(`${selector}-wrap`, 'supporting-css');
            el2.innerHTML = supportingCss;
            this.addRemoveTempStyleTagTimeout(attrSelector2);
            varValueFinal = varVal;
        } else {
            varValueFinal = varValue;
        }

        // #2: variable
        el.innerHTML = `${selector} { ${`--${varName}: ${varValueFinal};`} }`;

        this.addRemoveTempStyleTagTimeout(attrSelector);
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
     * @param {String} id Example '.j-Section-d-8'
     * @param {'var-override'|'supporting-css'} scope = 'var-override'
     * @returns {[HTMLStyleElement, String]} Example [el, '[data-temp-var-override-for=".j-Section-d-8"]']
     * @access private
     */
    createOrGetTempStyleTag(id, scope = 'var-override') {
        let el;
        const attrStr = `data-temp-${scope}-for`;
        const attrSelector = `[${attrStr}='${id}']`;
        if (!this.tempStyleOverrideNames.has(attrSelector)) {
            el = document.createElement('style');
            el.setAttribute(attrStr, id);
            const before = scope === 'supporting-css' ? document.head.querySelector('[data-temp-var-override-for]') : null;
            if (before) document.head.insertBefore(el, before);
            else document.head.appendChild(el);
            this.tempStyleOverrideNames.set(attrSelector, 1);
        } else {
            el = document.head.querySelector(attrSelector);
        }
        return [el, attrSelector];
    }
    /**
     * @param {String} attrSelector
     * @access private
     */
    addRemoveTempStyleTagTimeout(attrSelector) {
        const timeoutId = this.tempStyleOverrideElsRemoveTimeouts.get(attrSelector);
        if (timeoutId) clearTimeout(timeoutId);
        this.tempStyleOverrideElsRemoveTimeouts.set(attrSelector, setTimeout(() => {
            document.head.removeChild(document.head.querySelector(attrSelector));
            this.tempStyleOverrideNames.delete(attrSelector);
        }, 2000));
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
    /**
     * @access private
     */
    addClickHandlersCtrlClickVersion() {
        const metaKey = getMetaKey();
        window.addEventListener('keydown', e => {
            if (e.key === metaKey) this.metaKeyIsPressed = true;
        });
        window.addEventListener('keyup', e => {
            if (e.key === metaKey) this.metaKeyIsPressed = false;
        });
        document.body.addEventListener('click', e => {
            const currentBlock = this.currentlyHoveredBlockEl;
            if (this.isMouseListenersDisabled) { this.handlers.onClicked(currentBlock); return; }

            const isLeftClick = e.button === 0;
            const a = !isLeftClick ? null : e.target.nodeName === 'A' ? e.target : e.target.closest('a');

            const b = a || (e.button !== 0 ? null : e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button'));

            if (!this.metaKeyIsPressed)
                e.preventDefault();
            else if (a || b) {
                if (a) { e.preventDefault(); this.doFollowLink(a); }
                // else omit preventDefault
                return;
            }

            this.handlers.onClicked(currentBlock);
        });
    }
    /**
     * @access private
     */
    addClickHandlersLongClickVersion() {
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

/**
 * @param {HTMLElement} el Child node of $currentlyHoveredBlockEl
 * @param {HTMLDivElement} currentlyHoveredBlockEl
 * @returns {Boolean}
 */
function isSubHoverable(el, currentlyHoveredBlockEl) {
    return (
        // Is child of text block and ..
        currentlyHoveredBlockEl.getAttribute('data-block-type') === 'Text' &&
        // is first level child (h1, p, ul etc.) and ..
        el.parentElement === currentlyHoveredBlockEl &&
        // is not child _block_ (Button for example)
        !(el.getAttribute('data-block') || '').length
    );
}

export default EditAppAwareWebPage;
