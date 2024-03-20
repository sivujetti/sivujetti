import {urlAndSlugUtils, urlUtils} from '@sivujetti-commons-for-web-pages';
import {
    cloneDeep,
    completeImageSrc,
    placeholderImageSrc,
    traverseRecursively,
} from '../shared-inline.js';
import {convertHtmlStringsToVNodeArrays, createBlockTreeHashes} from './ReRenderingWebPageFuncs.js';

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

class ImageBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}) {
        return <figure { ...createDefaultProps() }>
            <img
                src={ block.src ? completeImageSrc(block.src, urlUtils) : placeholderImageSrc }
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
        console.log('ren lis');
        return <div { ...createDefaultProps(`page-type-${block.filterPageType.toLowerCase()}`) }>
            { renderedHtmlAsArr || null /* loading */ }
            { renderChildren() }
        </div>;
    }
    /**
     * @param {RawBlock} block
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
        const El = block.wrapEl || 'nav';
        return <El { ...createDefaultProps() }>
            { menuPrintBranch(block.tree, block) }
            { renderChildren() }
        </El>;
    }
}
/**
 * @param {Array<Object>} branch
 * @param {RawBlock} block
 * @param {Number} depth = 0
 * @returns {preact.VNode}
 */
function menuPrintBranch(branch, block, depth = 0) {
    const OuterEl = block.treeEl || 'ul';
    const outerElProps = block.treeElProps || {class: 'level-{depth}'};
    const ListItemEl = block.treeItemEl || 'li';
    const listItemElProps = block.treeItemElProps || {class: 'level-{depth}'};
    const currentPageSlug = '/'; // ??
    const linkElProps = block.linkeElProps || {};
    return <OuterEl class={ outerElProps.class.replace(/\{depth\}/, depth) }>
        { branch.map(({slug, text, children}) => {
            return <ListItemEl
                class={ listItemElProps.class.replace(/\{depth\}/, depth) }
                { ...(slug === currentPageSlug ? {'data-current': 'true'} : {}) }>
                <a
                    href={ maybeExternalUrl(slug) }
                    { ...linkElProps }>
                    { text }
                </a>
                { children.length
                    ? menuPrintBranch(children, block, depth + 1)
                    : null
                }
            </ListItemEl>;
        }) }
    </OuterEl>;
}
function maybeExternalUrl(url) {
    if (!isExternal(url)) return url;
    return `/sivujetti/index.php?q=${url}`;
}
function isExternal(url) {
    return false;
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

const builtInRenderers = {
    Button: ButtonBlock,
    Image: ImageBlock,
    Listing: ListingBlock,
    Menu: MenuBlock,
    Text: TextBlock,
};

class RenderAll extends preact.Component {
    // currentBlocksHashes;
    /**
     * @param {Array<RawBlock>} blocks
     * @access public
     */
    exchangeBlocks(blocks) {
        const noMetas = blocks.filter(b => b.type !== 'PageInfo');
        const hashesMap = {};
        createBlockTreeHashes(noMetas, hashesMap);
        this.currentBlocksHashes = hashesMap;

        const cloned = cloneDeep(noMetas);
        traverseRecursively(cloned, convertHtmlStringsToVNodeArrays);
        this.setState({blocks: cloned});
    }
    /**
     * @param {RawBlock} block
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
            const {type, styleClasses} = block;
            const renderChildren = () => block.children.length
                ? <RenderAll blocks={ block.children } depth={ depth + 1 } hashes={ this.currentBlocksHashes }/>
                : null;
            const createDefaultProps = (ownClasses = '') => ({
                'data-block': block.id,
                'data-block-type': block.type,
                'class': `j-${type}${ownClasses ? ` ${ownClasses}` : ''}${styleClasses ? ` ${styleClasses}` : ''}`,
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


    }
}

class RenderAllOuter extends RenderAll {
    /**
     * @access protected
     */
    componentWillMount() {
        super.componentWillMount();
    }
    /**
     * @access protected
     */
    componentDidMount() {
        super.componentWillMount();
    }
    /**
     * @param {MessagePort} messagePortToEditApp
     * @access private
     */
    setThisForMessaging(messagePortToEditApp) {
        this.messagePortToEditApp = messagePortToEditApp;
    }
}

export default RenderAllOuter;
export {api};
