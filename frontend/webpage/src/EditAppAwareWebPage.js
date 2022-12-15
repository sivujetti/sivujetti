import {CHILDREN_START, CHILDREN_END, noop} from '../../edit-app/src/block/dom-commons.js';
import ReRenderer, {findCommentR, getBlockEl, withTrid} from './ReRenderer.js';

class EditAppAwareWebPage {
    // data; // public
    // reRenderer; // public
    // currentlyHoveredRootEl;
    // isLocalLink;
    // tempStyleOverrideNames;
    // tempStyleOverrideElsRemoveTimeouts;
    /**
     * @param {CurrentPageData} dataFromAdminBackend
     */
    constructor(dataFromAdminBackend) {
        this.data = dataFromAdminBackend;
        this.currentlyHoveredRootEl = null;
        this.isLocalLink = createIsLocalLinkCheckFn();
        this.tempStyleOverrideNames = new Map;
        this.tempStyleOverrideElsRemoveTimeouts = new Map;
        this.reRenderer = null;
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
     * @param {String} blockId
     * @param {String} trid
     * @access public
     */
    setTridAttr(blockId, trid) {
        const el = getBlockEl(blockId);
        el.setAttribute('data-is-stored-to-trid', trid);
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
            if (!a || a.classList.contains('j-Button')) return;
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
                const hasBeenReplacedByPropUpdate = this.currentlyHoveredBlockEl.parentElement === null;
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
    }
    /**
     * @returns {(state: {themeStyles: Array<ThemeStyle>; [key: String]: any;}, eventInfo: ['themeStyles/addStyle'|'themeStyles/removeStyle'|'themeStyles/addUnitTo'|'themeStyles/removeUnitFrom', [String]|[ThemeStyle, String], Object]) => void}
     */
    createThemeStylesChangeListener() {
        const upsertInlineStyle = (blockTypeName, style) => {
            const css = style.units.map(({generatedCss}) => generatedCss).join('\n');
            const wrapped = `@layer ${blockTypeName !== '_body_' ? 'units' : 'body-unit'} { ${css} }`;
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
            }
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
     * @param {String} unitCls Example 'j-Heading-unit-6'
     * @param {String} varName Example 'textColor'
     * @param {String} varValue Example '#f5f5f5'
     * @param {'color'} valueType
     * @access public
     */
    fastOverrideStyleUnitVar(unitCls, varName, varValue, valueType) {
        if (valueType !== 'color') throw new Error();
        let el;
        if (!this.tempStyleOverrideNames.has(unitCls)) {
            el = document.createElement('style');
            el.setAttribute('data-temp-overrides-for', unitCls);
            document.head.appendChild(el);
            this.tempStyleOverrideNames.set(unitCls, 1);
        } else {
            el = document.head.querySelector(`[data-temp-overrides-for="${unitCls}"]`);
        }
        //
        el.innerHTML = `.${unitCls} { --${varName}: ${varValue}; }`;
        //
        const timeoutId = this.tempStyleOverrideElsRemoveTimeouts.get(unitCls);
        if (timeoutId) clearTimeout(timeoutId);
        this.tempStyleOverrideElsRemoveTimeouts.set(unitCls, setTimeout(() => {
            document.head.removeChild(document.head.querySelector(`[data-temp-overrides-for="${unitCls}"]`));
            this.tempStyleOverrideNames.delete(unitCls);
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
            const s = el.search; // todo what if non ?q ?
            window.parent.myRoute(!s ? el.pathname : s.split('=')[1]);
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

/**
 * Calls $fn once every $tryEveryMillis until it returns true or $stopTryingAfterNTimes
 * is reached.
 *
 * @param {() => Boolean} fn
 * @param {Number} tryEveryMillis = 200
 * @param {Number} stopTryingAfterNTimes = 5
 * @param {String} messageTmpl = 'fn() did not return true after %sms'
 * @returns {fn() => void}
 */
function createTrier(fn,
                     tryEveryMillis = 200,
                     stopTryingAfterNTimes = 5,
                     messageTmpl = 'fn() did not return true after %sms') {
    let tries = 0;
    const callTryFn = () => {
        const ret = fn();
        if (ret === true) {
            return;
        }
        if (ret === false) {
            if (++tries < stopTryingAfterNTimes)
                setTimeout(callTryFn, tryEveryMillis);
            else
                window.console.error(messageTmpl.replace('%s', tries * tryEveryMillis));
        } else {
            throw new Error('fn must return true or false, got: ', ret);
        }
    };
    return callTryFn;
}

export default EditAppAwareWebPage;
export {createTrier, withTrid};
