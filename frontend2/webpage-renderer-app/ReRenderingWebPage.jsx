import {env, http, urlAndSlugUtils, urlUtils} from '@sivujetti-commons-for-web-pages';
import {
    cloneDeep,
    completeImageSrc,
    getBlockEl,
    getMetaKey,
    traverseRecursively,
} from '../shared-inline.js';
import {
    createBlockTreeHashes,
    htmlStringToVNodeArray,
    stringHtmlPropToVNodeArray,
} from './ReRenderingWebPageFuncs.js';

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

class ButtonBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, createDefaultProps, renderChildren}) {
        const [El, attrs] = block.tagType !== 'link'
            ? ['button', {type: block.tagType}]
            : ['a',      {href: urlAndSlugUtils.getCompletedUrl(block.linkTo)}];
        return <El { ...createDefaultProps('btn') }{ ...attrs }>
            { block.html }
            { renderChildren() }
        </El>;
    }
}

class CodeBlock extends preact.Component {
    // lastExecutedCode;
    /**
     * @access protected
     */
    componentDidMount() {
        const {id, code} = this.props.block;
        if (this.lastExecutedCode === code) return;
        this.lastExecutedCode = code;
        const {head} = document;
        // Remove previous injections (if any)
        [...head.querySelectorAll(`[data-injected-by-sivujetti-code-block="${id}"]`)].forEach(el => {
            head.removeChild(el);
        });
        // Inject again
        const temp = document.createElement('div');
        temp.innerHTML = code;
        [...temp.querySelectorAll('script')].forEach(el => {
            injectScript(el, head, [{name: 'data-injected-by-sivujetti-code-block', value: id}]);
        });
    }
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, createDefaultProps}) {
        return <div
            { ...createDefaultProps() }
            dangerouslySetInnerHTML={ {
                __html: block.code || __('Waits for configuration ...'),
            } }></div>;
    }
}

/**
 * @param {HTMLScriptElement} original
 * @param {HTMLElement} toEl
 * @param {Array<{name: String; value: String;}>} extraAttrs
 */
function injectScript(original, toEl, extraAttrs = []) {
    const inject = document.createElement('script');
    [...original.attributes, ...extraAttrs].forEach(attr => {
        inject.setAttribute(attr.name, attr.value);
    });
    if (original.innerHTML)
        inject.innerHTML = original.innerHTML;
    toEl.appendChild(inject);
}

class ColumnsBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}) {
        const extraClasses = [
            'num-cols-', parseInt(block.numColumns),
            block.takeFullWidth ? '' : ' inline'
        ].join('');
        return <div { ...createDefaultProps(extraClasses) }>
            { renderChildren() }
        </div>;
    }
}

class ImageBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}) {
        return <figure { ...createDefaultProps() }>
            <img
                src={ completeImageSrc(block.src, urlUtils) }
                alt={ block.altText }/>
            { block.caption ? <figcaption>{ block.caption }</figcaption> : '' }
            { renderChildren() }
        </figure>;
    }
}

/** @type {Map<String, {arr: Array<preact.ComponentChild>; hash: String;}>} */
const cachedRenders =  new Map;
class ListingBlock extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {block} = this.props;
        const fromCache = cachedRenders.get(block.id);
        this.setState({
            renderedHtmlAsArr: fromCache ? [...fromCache.arr] : null,
        });
        if (fromCache) {
            const maybeNextHash = createHash(block);
            if (fromCache.hash !== maybeNextHash)
                this.renderInBackendAndSetToState(block, maybeNextHash);
        } else {
            this.renderInBackendAndSetToState(block);
        }
    }
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}, {__pages, __pageType, renderedHtmlAsArr}) {
        return <div { ...createDefaultProps(`page-type-${block.filterPageType.toLowerCase()}`) }>
            { renderedHtmlAsArr || null /* loading */ }
            { renderChildren() }
        </div>;
    }
    /**
     * @param {Block} block
     * @param {String} hash = null
     * @access private
     */
    renderInBackendAndSetToState(block, hash = null) {
        http.post('/api/blocks/render', {block})
            .then(resp => {
                const withWrapperDiv = htmlStringToVNodeArray(resp.result);
                const divChildren = withWrapperDiv[0].props.children;
                cachedRenders.set(block.id, {arr: divChildren, hash: hash || createHash(block)});
                this.setState({renderedHtmlAsArr: cachedRenders.get(block.id).arr});
            })
            .catch(err => {
                env.window.console.error(err);
                this.setState({renderedHtmlAsArr: <p>{ __('Failed to render content.') }</p>});
            });
    }
}
function createHash(block) {
    return JSON.stringify({...block.propsData, renderer: block.renderer});
}
function __(s) {
    return s;
}

class MenuBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}) {
        return <nav { ...createDefaultProps() }>
            { menuPrintBranch(block.tree, block) }
            { renderChildren() }
        </nav>;
    }
}
/**
 * @param {Array<Object>} branch
 * @param {Block} block
 * @param {Number} depth = 0
 * @returns {preact.VNode}
 */
function menuPrintBranch(branch, block, depth = 0) {
    const currentPageSlug = '-';
    return <ul class={ `level-${depth}` }>{ branch.map(({slug, text, children}) => <li>
        <a
            href={ urlAndSlugUtils.getCompletedUrl(slug) }
            class={ `level-${depth}` }
            { ...(slug === currentPageSlug ? {'data-current': 'true'} : {}) }>
            { text }
        </a>
        { children.length
            ? menuPrintBranch(children, block, depth + 1)
            : null
        }
    </li>) }</ul>;
}

class SectionBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}) {
        return <section { ...{
            ...createDefaultProps(),
            ...(block.bgImage ? {style: `background-image:url('${completeImageSrc(block.bgImage, urlUtils)}')`} : {})
        } }>
            <div data-block-root>
                { renderChildren() }
            </div>
        </section>;
    }
}

class Section2Block extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({renderChildren, createDefaultProps}) {
        return <div { ...createDefaultProps() }>
            <div class="j-Section2-cols">
                { renderChildren() }
            </div>
        </div>;
    }
}

class TextBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, createDefaultProps, renderChildren}) {
        return <div { ...createDefaultProps() }>
            { block.html }
            { renderChildren() }
        </div>;
    }
}

class WrapperBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({renderChildren, createDefaultProps}) {
        return <div { ...createDefaultProps() }>
            { /* Nothing */ }
            { renderChildren() }
        </div>;
    }
}

const builtInRenderers = {
    Button: ButtonBlock,
    Code: CodeBlock,
    Columns: ColumnsBlock,
    Image: ImageBlock,
    Listing: ListingBlock,
    Menu: MenuBlock,
    Section: SectionBlock,
    Section2: Section2Block,
    Text: TextBlock,
    Wrapper: WrapperBlock,
};

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
        const links = docBody.querySelectorAll('a');
        for (const a of links) {
            const hrefAsAuthored = a.getAttribute('href');
            if (hrefAsAuthored.startsWith('#') || hrefAsAuthored === '') {
                if (this.baseUrl.indexOf('.php?') < 0) {
                    // 'https://domain.com/?in-edit=1#foo'     -> 'https://domain.com/#foo' or
                    // 'https://domain.com/?in-edit=1'         -> 'https://domain.com/' or
                    // 'https://domain.com/page?in-edit=1#foo' -> 'https://domain.com/page#foo' or
                    // 'https://domain.com/page?in-edit=1'     -> 'https://domain.com/page'
                    a.href = a.href.replace('?in-edit=1', '');
                } else {
                    // 'https://domain.com/index.php?q=/&in-edit=1#foo'     -> 'https://domain.com/index.php?q=/#foo'
                    // 'https://domain.com/index.php?q=/&in-edit=1'         -> 'https://domain.com/index.php?q=/' or
                    // 'https://domain.com/index.php?q=/page&in-edit=1#foo' -> 'https://domain.com/index.php?q=/page#foo'
                    // 'https://domain.com/index.php?q=/page&in-edit=1'     -> 'https://domain.com/index.php?q=/page'
                    a.href = a.href.replace('&in-edit=1', '');
                }
            }
        }
        //
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
            const noOrigin = el.href.substring(el.origin.length); // http://domain.com/foo -> /foo
                                                                  // http://domain.com/foo/index.php?q=/foo -> /foo/index.php?q=/foo
            const noBase = `/${noOrigin.substring(this.baseUrl.length)}`; // /foo -> /foo
                                                                          // /sub-dir/foo -> /foo
                                                                          // /index.php?q=/foo -> /foo
                                                                          // /sub-dir/index.php?q=/foo -> /foo
            const pcs = noBase.split('#');
            if (pcs.length < 2)
                window.parent.myRoute(pcs[0]);
            else
                document.getElementById(pcs[1])?.scrollIntoView();
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
            const a = !isLeftClick ? null : e.target.nodeName === 'A' ? e.target : e.target.closest('a');

            const b = a || (e.button !== 0 ? null : e.target.classList.contains('j-Button') ? e.target : e.target.closest('.j-Button'));

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
