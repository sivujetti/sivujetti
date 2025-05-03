import {urlUtils} from '@sivujetti-commons-for-web-pages';
import {getMetaKey, getBlockEl, traverseRecursively} from '../shared-inline.js';
import {stringHtmlPropToVNodeArray} from './ReRenderingWebPageFuncs.js';
import builtInRenderers, {setMessagePort} from './builtin-renderers-all.jsx';
/** @typedef {import('./in-context-editing.js').InContextEditingApp} InContextEditingApp */

const useCtrlClickBasedFollowLinkLogic = true;

const registry = new Map;

const api = {
    /**
     * @param {string} name
     * @param {preact.AnyComponent} Cls
     */
    registerRenderer(name, Cls) {
        api.export(`customRenderers/${name}`, Cls);
    },
    /**
     * @param {string} name
     * @param {any} item
     */
    export(name, item) {
        registry.set(name, item);
    },
    /**
     * @param {string} name
     * @returns {any}
     */
    import(name) {
        return registry.get(name);
    },
};

/** @extends {preact.Component<ReRenderingWebPageProps, any>} */
class RenderAll extends preact.Component {
    constructor(props) {
        super(props);
        /** @type {MessagePort} */
        this.messagePortToEditApp = null;
        /** @type {{el: HTMLElement; blockId: string; nthOfId: number;}} */
        this.curHoveredBlock = null;
        /** @type {boolean} */
        this.metaKeyIsPressed = false;
        /** @type {string} */
        this.baseUrl = null;
        /** @type {(link: HTMLAnchorElement) => boolean} */
        this.isLocalLink = null;
    }
    /**
     * @param {MessagePort} messagePortToEditApp
     * @param {ReRenderingWebPageMouseState|null} prevIframeMouseState
     * @access public
     */
    hookUpEventHandlersAndEmitters(messagePortToEditApp, prevIframeMouseState) {
        this.messagePortToEditApp = messagePortToEditApp;
        setMessagePort(this.messagePortToEditApp);
        if (prevIframeMouseState) {
            this.metaKeyIsPressed = prevIframeMouseState.metaKeyIsPressed;
            if (prevIframeMouseState.curHoverBlockBlockId) {
                const el = getBlockEl(
                    prevIframeMouseState.curHoverBlockBlockId,
                    prevIframeMouseState.curHoverBlockNthOfId,
                );
                if (el) this.curHoveredBlock = {
                    el,
                    blockId: prevIframeMouseState.curHoverBlockBlockId,
                    nthOfId: prevIframeMouseState.curHoverBlockNthOfId,
                };
            }
        }
        this.hookUpEventHandlers();
    }
    /**
     * @param {Array<Block>} newBlocks With nested __globalBlockTree's
     * @access public
     */
    exchangeBlocks(newBlocks) {
        const noMetas = newBlocks.filter(b => b.type !== 'PageInfo');
        traverseRecursively(noMetas, stringHtmlPropToVNodeArray);
        this.setState({blocks: noMetas});
    }
    /**
     * @param {Block} block
     * @param {Array<Block>} allBlocks
     * @access public
     */
    exchangeSingleBlock(block, allBlocks) {
        this.exchangeBlocks(allBlocks);
    }
    /**
     * @returns {ReRenderingWebPageMouseState}
     * @access public
     */
    getMouseState() {
        return {
            curHoverBlockBlockId: this.curHoveredBlock?.blockId,
            curHoverBlockNthOfId: this.curHoveredBlock?.nthOfId,
            metaKeyIsPressed: !!this.metaKeyIsPressed,
        };
    }
    /**
     * @param {boolean} isDown
     * @access private
     */
    handleEditAppMetaKeyPressedOrReleased(isDown) {
        this.metaKeyIsPressed = isDown;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.metaKeyIsPressed = !!this.props.metaKeyIsPressed;
        this.exchangeBlocks(this.props.blocks);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.baseUrl = urlUtils.baseUrl;
        this.isLocalLink = createIsLocalLinkCheckFn();
    }
    /**
     * @param {preact.Component} Cls
     * @param {Block} _block
     * @returns {preact.Component}
     * @access protected
     */
    createRendererCls(Cls, _block) {
        return Cls;
    }
    /**
     * @access protected
     */
    render(_, {blocks}) {
        return this.doRender(blocks, 0);
    }
    /**
     * @param {Array<Block>} branch
     * @param {number} depth
     * @access private
     */
    doRender(branch, depth) {
        return branch.map(block => {
            if (block.type === 'GlobalBlockReference')
                return this.doRender(
                    block.__globalBlockTree.blocks,
                    depth
                );
            const {type, styleClasses, renderer} = block;
            const rendererCls = renderer === 'jsx' || renderer.indexOf(':block-listing-') > -1
                ? (builtInRenderers[type] || api.import(`customRenderers/${type}`))
                : api.import(`customRenderers/${renderer}`);
            const Renderer = this.createRendererCls(rendererCls, block);
            if (!Renderer) return <p>{ renderer === 'jsx'
                ? `Block type \`${type}\` doesn't have a renderer!`
                : `Renderer "${renderer || 'none provided'}" does not exist`
            }</p>;
            return <Renderer
                block={ block }
                createDefaultProps={ (ownClasses = '') => ({
                    'data-block': block.id,
                    'data-block-type': type,
                    'class': `j-${type}${ownClasses ? ` ${ownClasses}` : ''}${styleClasses ? ` ${styleClasses}` : ''}`,
                }) }
                renderChildren={ () =>
                    block.children.length
                        ? this.doRender(block.children, depth + 1)
                        : null
                }/>;
        });
    }
    /**
     * @access private
     */
    hookUpEventHandlers() {
        const docBody = this.props.outerEl;
        this.addHoverHanders(docBody, this.props.inContextEditingApp);
        //
        if (useCtrlClickBasedFollowLinkLogic)
            this.addClickHandlersCtrlClickVersion(docBody);
        else
            this.addClickHandlersLongClickVersion();
    }
    /**
     * @param {HTMLBodyElement} docBody
     * @param {Object} inContextEditingApp = null
     */
    addHoverHanders(docBody, inContextEditingApp = null) {
        const handleMouseEntered = el => {
            this.curHoveredBlock = {
                el: el,
                blockId: getBlockId(el),
                nthOfId: [...docBody.querySelectorAll(`[data-block="${getBlockId(el)}"]`)].indexOf(el) + 1,
            };
            this.messagePortToEditApp.postMessage(['onBlockHoverStarted',
                this.curHoveredBlock.blockId,
                this.curHoveredBlock.nthOfId,
                el.getBoundingClientRect()]);
        };
        const handleMouseExited = el => {
            this.curHoveredBlock = null;
            this.messagePortToEditApp.postMessage(['onBlockHoverEnded',
                getBlockId(el)]);
        };
        const handleMouseEnteredTextChild = (childEl, textBlockEl) => {
            this.messagePortToEditApp.postMessage(['onTextBlockChildElHoverStarted',
                [...textBlockEl.children].indexOf(childEl),
                getBlockId(textBlockEl),
                [...docBody.querySelectorAll(`[data-block="${getBlockId(textBlockEl)}"]`)].indexOf(textBlockEl) + 1]);
        };
        const handleMouseExitedTextChild = _el => {
            this.messagePortToEditApp.postMessage(['onTextBlockChildElHoverEnded']);
        };
        const stack = [];
        if (inContextEditingApp) {
        const beginHover = (el) => {
            this.curHoveredBlock = {
                el,
                blockId: getBlockId(el),
                nthOfId: [...docBody.querySelectorAll(`[data-block="${getBlockId(el)}"]`)].indexOf(el) + 1,
            };
            inContextEditingApp.onBlockHoverStarted(
                this.curHoveredBlock.blockId,
                this.curHoveredBlock.el.getAttribute('data-block-type'),
                {posRect: el.getBoundingClientRect()}
            );
        };
        docBody.addEventListener('mouseenter', e => {
            if (e.target.className === 'incontext-app-container')
                return;
            /** @type {HTMLElement} */
            const {target} = e;
            if (e.relatedTarget?.className === 'incontext-app-container') {
                const el = isBlockEl(target) ? target : (target.closest ? target : {closest: () => undefined}).closest('[data-block]');
                if (el && !isPlacholderBlockEl(el)) {
                    beginHover(el);
                    stack.push(target);
                }
                return;
            }
            const isEditableBlock = isBlockEl(target) && !isPlacholderBlockEl(target);
            if (!isEditableBlock && stack.length && isBlockEl(stack.at(-1))) {
                if (stack.at(-1).contains(e.target)) // Enter .j-Something > child
                    return;
            }
            stack.push(e.target);
            if (isEditableBlock) {
                beginHover(target);
            }
        }, true);

        docBody.addEventListener('mouseleave', e => {
            if (e.target.className === 'incontext-app-container')
                return;
            if (e.target === document.body) {
                inContextEditingApp.clearAll();
                stack.splice(0, stack.length);
                return;
            }
            if (e.relatedTarget?.className === 'incontext-app-container') {
                inContextEditingApp.onBlockHoverEnded(true);
                stack.pop();
                return;
            }
            if (stack.at(-1) === e.target && isBlockEl(e.target))
                inContextEditingApp.onBlockHoverEnded();
            else if (stack.length > 1 && stack.at(-1).contains(e.target))
                return;
            stack.pop();
        }, true);
        } else {
        docBody.addEventListener('mouseenter', e => {
            if (stack.indexOf(e.target) > -1) return;
            stack.push(e.target);
            const end = stack.at(-1);
            const endParent = stack.at(-2) || null;
            if (isBlockEl(end)) {
                if (endParent && isBlockEl(endParent))
                    handleMouseExited(endParent);
                handleMouseEntered(end);
            } else if (endParent && isSubHoverable(end, endParent)) {
                handleMouseEnteredTextChild(end, endParent);
            }
        }, true);

        docBody.addEventListener('mouseleave', e => {
            if (stack.indexOf(e.target) < 0) return;
            const end = stack.at(-1);
            const endParent = stack.at(-2) || null;
            // Example:
            // [body.j-_body_, ..., div.j-Text,   p  ]
            //                           ^        ^
            //                        endParent  end
            if (endParent && isSubHoverable(end, endParent)) {
                handleMouseExitedTextChild(end);
            } else {
                const endParent2 = stack.at(-3) || null;
                if (isBlockEl(end))
                    handleMouseExited(end);
                // Example:
                // [body.j-_body_, div.j-Section2, div.j-Section2-cols, div.j-Wrapper]
                //                        ^                ^                    ^
                //                    endParent2        endParent              end
                if (endParent2 && isBlockEl(endParent2))
                    handleMouseEntered(endParent2);
                // Example:
                // [body.j-_body_, ..., nav.j-Menu, a.j-Button]
                //                          ^            ^
                //                      endParent       end
                if (endParent && isBlockEl(endParent))
                    handleMouseEntered(endParent);
            }
            stack.pop();
        }, true);
        }
    }
    /**
     * @param {HTMLBodyElement} docBody
     * @access private
     */
    addClickHandlersCtrlClickVersion(docBody) {
        const metaKey = getMetaKey();
        window.addEventListener('keydown', e => {
            if (e.key === metaKey) this.metaKeyIsPressed = true;
        });
        window.addEventListener('keyup', e => {
            if (e.key === metaKey) this.metaKeyIsPressed = false;
        });
        docBody.addEventListener('click', e => {
            const currentBlock = this.curHoveredBlock;
            if (!currentBlock)
                return;

            const isLeftClick = e.button === 0;
            const a = isLeftClick ? e.target.nodeName === 'A' ? e.target : e.target.closest('a') : null;
            const b = a || (isLeftClick ? e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button') : null);

            if (!this.metaKeyIsPressed)
                e.preventDefault();
            else if ((a || b) && !e.defaultPrevented) {
                if (a) { e.preventDefault(); this.doFollowLink(a); }
                // else omit preventDefault
                return;
            }

            const {blockId, nthOfId} = currentBlock;
            if (blockId) this.messagePortToEditApp.postMessage(['onClicked', blockId, nthOfId]);
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
            if (!this.curHoveredBlock) return;
            isDown = true;
            const a = e.button !== 0 ? null : e.target.nodeName === 'A' ? e.target : e.target.closest('a');
            if (!a) return;
            lastDownLink = a;
            lastDownLinkAlreadyHandled = false;
            setTimeout(() => {
                if (isDown && e.button === 0) {
                    lastDownLinkAlreadyHandled = true;
                    this.messagePortToEditApp.postMessage(['onClicked',
                        this.curHoveredBlock.blockId, this.curHoveredBlock.nthOfId]);
                }
            }, 80);
        });
        document.body.addEventListener('click', e => {
            const currentBlock = this.curHoveredBlock;
            isDown = false;
            if (!lastDownLink) {
                const b = e.button !== 0 ? null : e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button');
                if (b) e.preventDefault();
                this.messagePortToEditApp.postMessage(['onClicked', currentBlock.blockId, currentBlock.nthOfId]);
            } else {
                e.preventDefault();
                if (!lastDownLinkAlreadyHandled) {
                    this.messagePortToEditApp.postMessage(['onClicked', null, null]);
                    this.doFollowLink(lastDownLink);
                }
                lastDownLink = null;
            }
        });
    }
    /**
     * @param {HTMLAnchorElement} el
     * @access private
     */
    doFollowLink(el) {
        if (this.isLocalLink(el)) {
            const hrefAsAuthored = el.getAttribute('href');
            if (hrefAsAuthored.startsWith('#')) {
                document.getElementById(hrefAsAuthored.substring(1))?.scrollIntoView();
                return;
            }
            if (!hrefAsAuthored) {
                // `href=""`, Do nothing
                return;
            }
            const noOrigin = el.href.substring(el.origin.length); // http://domain.com/foo -> /foo
                                                                  // http://domain.com/foo/index.php?q=/foo -> /foo/index.php?q=/foo
            const noBase = `/${noOrigin.substring(this.baseUrl.length)}`; // /foo -> /foo
                                                                          // /sub-dir/foo -> /foo
                                                                          // /index.php?q=/foo -> /foo
                                                                          // /sub-dir/index.php?q=/foo -> /foo
            // Note: $noBase may contain hash here (/slug#hash), allow it
            window.parent.myRoute(noBase);
        }
    }
}

/**
 * @param {HTMLElement} el
 * @returns {string|null}
 */
function getBlockId(el) {
    return el.getAttribute('data-block');
}

/**
 * https://stackoverflow.com/a/2911045
 *
 * @param {Location} location = window.location
 * @returns {(link: HTMLAnchorElement) => boolean}
 */
function createIsLocalLinkCheckFn(location = window.location) {
    const host = location.hostname;
    return a => a.hostname === host || !a.hostname.length;
}

/**
 * @param {HTMLElement} el Child node of $currentlyHoveredBlockEl
 * @param {HTMLDivElement} currentlyHoveredBlockEl
 * @returns {boolean}
 */
function isSubHoverable(el, currentlyHoveredBlockEl) {
    return (
        // Is child of text block and ..
        currentlyHoveredBlockEl.getAttribute('data-block-type') === 'Text' &&
        // is first level child (h1, p, ul etc.) and ..
        el.parentElement === currentlyHoveredBlockEl &&
        // is not child _block_ (Button for example)
        !(getBlockId(el) || '').length
    );
}

/**
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isBlockEl(el) {
    return !!el.getAttribute('data-block-type');
}

/**
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isPlacholderBlockEl(el) {
    return el.getAttribute('data-block-type') === 'ContentOrRowPlaceholder';
}

api.export('ReRenderingWebPage', RenderAll);

/**
 * @typedef {{
 *   hookUpEventHandlersAndEmitters(messagePortToEditApp: MessagePort, prevIframeMouseState: ReRenderingWebPageMouseState|null): void;
 *   exchangeBlocks(newBlocks: Array<Block>): void;
 *   exchangeSingleBlock(block: Block, allBlocks: Array<Block>): void;
 *   getMouseState(): ReRenderingWebPageMouseState;
 *   handleEditAppMetaKeyPressedOrReleased(isDown: boolean): void;
 * } & preact.Component} ReRenderingWebPage
 *
 * @typedef {{
 *   blocks: Array<Block>;
 *   outerEl:HTMLBodyElement;
 *   inContextEditingApp?: InContextEditingApp;
 *   metaKeyIsPressed?: boolean;
 * }} ReRenderingWebPageProps
 *
 * @typedef {{
 *   metaKeyIsPressed: boolean;
 *   curHoverBlockBlockId?: string;
 *   curHoverBlockNthOfId?: number;
 * }} ReRenderingWebPageMouseState
 */

export default RenderAll;
export {api};
