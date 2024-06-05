import {urlUtils} from '@sivujetti-commons-for-web-pages';
import {
    cloneDeep,
    getBlockEl,
    getMetaKey,
    traverseRecursively,
} from '../shared-inline.js';
import {
    createBlockTreeHashes,
    stringHtmlPropToVNodeArray,
} from './ReRenderingWebPageFuncs.js';
import builtInRenderers from './builtin-renderers-all.jsx';

/** @type {Map<String, preact.AnyComponent>} */
const customRenderers = new Map;
const api = {
    /**
     * @param {String} name
     * @param {preact.AnyComponent} Cls
     */
    registerRenderer(name, Cls) {
        customRenderers.set(name, Cls);
    }
};

const useCtrlClickBasedFollowLinkLogic = true;

class RenderAll extends preact.Component {
    // currentBlocksHashes;
    /**
     * @param {Array<Block>} blocks
     * @access public
     */
    exchangeBlocks(blocks) {
        const noMetas = blocks.filter(b => b.type !== 'PageInfo');
        const hashesMap = {};
        createBlockTreeHashes(noMetas, hashesMap);
        this.currentBlocksHashes = hashesMap;

        const cloned = cloneDeep(noMetas);
        traverseRecursively(cloned, stringHtmlPropToVNodeArray);
        this.setState({blocks: cloned});
    }
    /**
     * @param {Block} block
     * @access public
     */
    exchangeSingleBlock(block, blocks) {
        this.exchangeBlocks(blocks);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        if (!this.props.hashes)
            this.exchangeBlocks(this.props.blocks);
        else {
            this.currentBlocksHashes = this.props.hashes;
            this.setState({blocks: this.props.blocks});
        }
    }
    /**
     * @param {{depth?: Number; hashes?: {[blockId: String]: String;};}} props
     * @access protected
     */
    render({depth}, {blocks}) {
        return blocks.map(block => {
            depth = (depth || 0);
            const key = `k-${depth}-${this.currentBlocksHashes[block.id]}`;
            if (block.type === 'GlobalBlockReference') {
                return <RenderAll
                    blocks={ block.__globalBlockTree.blocks }
                    depth={ depth }
                    hashes={ this.currentBlocksHashes }
                    key={ this.currentBlocksHashes[block.id] }/>;
            }
            const {type, styleClasses, styleGroup} = block;
            const renderChildren = () => block.children.length
                ? <RenderAll blocks={ block.children } depth={ depth + 1 } hashes={ this.currentBlocksHashes }/>
                : null;
            const createDefaultProps = (ownClasses = '') => ({
                ...{
                    'data-block': block.id,
                    'data-block-type': type,
                    'class': `j-${type}${ownClasses ? ` ${ownClasses}` : ''}${styleClasses ? ` ${styleClasses}` : ''}`,
                },
                ...(styleGroup ? {
                    'data-style-group': styleGroup,
                } : {})
            });
            const Renderer = builtInRenderers[type] || customRenderers.get(type) || null;
            if (!Renderer) return <p>{ `Block type \`${type}\` doesn't have a renderer!` }</p>;
            return <Renderer
                block={ block }
                createDefaultProps={ createDefaultProps }
                renderChildren={ renderChildren }
                key={ key }/>;
        });
    }
}

class RenderAllOuter extends RenderAll {
    // messagePortToEditApp;
    // curHoveredBlockEl;
    // metaKeyIsPressed;
    // baseUrl;
    // isLocalLink;
    /**
     * @param {MessagePort} messagePortToEditApp
     * @access public
     */
    hookUpEventHandlersAndEmitters(messagePortToEditApp) {
        this.messagePortToEditApp = messagePortToEditApp;
        this.hookUpEventHandlers();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        super.componentWillMount();
        this.metaKeyIsPressed = !!this.props.metaKeyIsPressed;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        super.componentWillMount();
        this.baseUrl = urlUtils.baseUrl;
        this.isLocalLink = createIsLocalLinkCheckFn();
    }
    /**
     * @access private
     */
    hookUpEventHandlers() {
        const docBody = this.props.outerEl;
        this.addHoverHanders(docBody);
        //
        if (useCtrlClickBasedFollowLinkLogic)
            this.addClickHandlersCtrlClickVersion(docBody);
        else
            this.addClickHandlersLongClickVersion();
    }
    /**
     * @param {Boolean} isDown
     * @access private
     */
    handleEditAppMetaKeyPressedOrReleased(isDown) {
        this.metaKeyIsPressed = isDown;
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
    /**
     * @param {HTMLBodyElement} docBody
     */
    addHoverHanders(docBody) {
        const handleMouseEntered = el => {
            this.curHoveredBlockEl = el;
            this.messagePortToEditApp.postMessage(['onBlockHoverStarted',
                getBlockId(el),
                el.getBoundingClientRect()]);
        };
        const handleMouseExited = el => {
            this.curHoveredBlockEl = null;
            this.messagePortToEditApp.postMessage(['onBlockHoverEnded',
                getBlockId(el)]);
        };
        const handleMouseEnteredTextChild = (childEl, textBlockEl) => {
            this.messagePortToEditApp.postMessage(['onTextBlockChildElHoverStarted',
                Array.from(textBlockEl.children).indexOf(childEl),
                getBlockId(textBlockEl)]);
        };
        const handleMouseExitedTextChild = _el => {
            this.messagePortToEditApp.postMessage(['onTextBlockChildElHoverEnded']);
        };
        const stack = [];
        docBody.addEventListener('mouseenter', e => {
            if (this.isMouseListenersDisabled) return;
            if (stack.indexOf(e.target) > -1) return;
            stack.push(e.target);
            const end = stack.at(-1);
            const endParen = stack.at(-2) || null;
            if (isBlockEl(end)) {
                if (endParen && isBlockEl(endParen))
                    handleMouseExited(endParen);
                handleMouseEntered(end);
            } else if (endParen && isSubHoverable(end, endParen)) {
                handleMouseEnteredTextChild(end, endParen);
            }
        }, true);

        docBody.addEventListener('mouseleave', e => {
            if (this.isMouseListenersDisabled) return;
            if (stack.indexOf(e.target) < 0) return;
            const end = stack.at(-1);
            const endParen = stack.at(-2) || null;
            // Example:
            // [body.j-_body_, ..., div.j-Text,   p  ]
            //                           ^        ^
            //                        endParen   end
            if (endParen && isSubHoverable(end, endParen)) {
                handleMouseExitedTextChild(end);
            } else {
                const endParen2 = stack.at(-3) || null;
                if (isBlockEl(end))
                    handleMouseExited(end);
                // Example:
                // [body.j-_body_, div.j-Section2, div.j-Section2-cols, div.j-Wrapper]
                //                        ^                ^                    ^
                //                    endParen2         endParen               end
                if (endParen2 && isBlockEl(endParen2))
                    handleMouseEntered(endParen2);
                // Example:
                // [body.j-_body_, ..., nav.j-Menu, a.j-Button]
                //                          ^            ^
                //                      endParen        end
                if (endParen && isBlockEl(endParen))
                    handleMouseEntered(endParen);
            }
            stack.pop();
        }, true);
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
            const currentBlock = this.curHoveredBlockEl;
            if (this.isMouseListenersDisabled) {
                this.messagePortToEditApp.postMessage(['onClicked', getBlockId(currentBlock)]);
                return;
            }

            const isLeftClick = e.button === 0;
            const a = isLeftClick ? e.target.nodeName === 'A' ? e.target : e.target.closest('a') : null;
            const b = a || (isLeftClick ? e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button') : null);

            if (!this.metaKeyIsPressed)
                e.preventDefault();
            else if (a || b) {
                if (a) { e.preventDefault(); this.doFollowLink(a); }
                // else omit preventDefault
                return;
            }

            this.messagePortToEditApp.postMessage(['onClicked', getBlockId(currentBlock)]);
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
            if (!(this.curHoveredBlockEl || this.isMouseListenersDisabled)) return;
            isDown = true;
            const a = e.button !== 0 ? null : e.target.nodeName === 'A' ? e.target : e.target.closest('a');
            if (!a) return;
            lastDownLink = a;
            lastDownLinkAlreadyHandled = false;
            setTimeout(() => {
                if (isDown && e.button === 0) {
                    lastDownLinkAlreadyHandled = true;
                    this.messagePortToEditApp.postMessage(['onClicked',
                        getBlockId(this.curHoveredBlockEl)]);
                }
            }, 80);
        });
        document.body.addEventListener('click', e => {
            const currentBlock = this.curHoveredBlockEl;
            isDown = false;
            if (!lastDownLink) {
                if (this.isMouseListenersDisabled) {
                    this.messagePortToEditApp.postMessage(['onClicked', getBlockId(currentBlock)]);
                    return;
                }
                const b = e.button !== 0 ? null : e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button');
                if (b) e.preventDefault();
                this.messagePortToEditApp.postMessage(['onClicked', getBlockId(currentBlock)]);
            } else {
                e.preventDefault();
                if (!lastDownLinkAlreadyHandled) {
                    this.messagePortToEditApp.postMessage(['onClicked', null]);
                    this.doFollowLink(lastDownLink);
                }
                lastDownLink = null;
            }
        });
    }
}

/**
 * @param {HTMLElement} el
 * @returns {String|null}
 */
function getBlockId(el) {
    return el.getAttribute('data-block');
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
        !(getBlockId(el) || '').length
    );
}

/**
 * @param {HTMLElement} el
 * @returns {Boolean}
 */
function isBlockEl(el) {
    return !!el.getAttribute('data-block-type');
}

export default RenderAllOuter;
export {api};
