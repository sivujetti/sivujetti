import {
    traverseRecursively,
} from '../shared-inline.js';


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
            { block.html /* todo */ }
            { renderChildren() }
        </div>;
    }
}

const renderers = {
    Menu: MenuBlock,
    Text: TextBlock,
};

class RenderAll extends preact.Component {
    // currentBlocksHashes;
    /**
     * @access protected
     */
    componentWillMount() {
        this.exchangeBlocks(this.props.blocks);
    }
    /**
     * @param {{depth?: Number;}} props
     * @access protected
     */
    render({depth}, {blocks}) {
        return blocks.map(block => {
            const {type, styleClasses} = block;
            const renderChildren = () => block.children.length ? <RenderAll blocks={ block.children } depth={ (depth || 0 ) + 1 }/> : null;
            const createDefaultProps = (ownClasses = '') => ({
                'data-block': block.id,
                'data-block-type': block.type,
                'class': `j-${type}${ownClasses ? ` ${ownClasses}` : ''}${styleClasses ? ` ${styleClasses}` : ''}`,
            });
            const Renderer = renderers[type] || null;
            if (!Renderer) return <p>{ `Block type \`${type}\` doesn't have a renderer!` }</p>;
            return <Renderer
                block={ block }
                createDefaultProps={ createDefaultProps }
                renderChildren={ renderChildren }
                key={ `k-${depth}-${this.currentBlocksHashes[block.id]}`}/>;
        });
    }
    /**
     * @param {Array<RawBlock>} blocks
     * @access private
     */
    exchangeBlocks(blocks) {
        const noMetas = blocks.filter(b => b.type !== 'PageInfo');

        const hashes = {};
        traverseRecursively(noMetas, b => {
            if (!hashes[b.id]) hashes[b.id] = hashCode(JSON.stringify(b, (key, value) => {
                if (key === 'children')
                    return undefined;
                if (key.startsWith('__'))
                    return undefined;
                return value;
            }));
        });
        this.currentBlocksHashes = hashes;

        const cloned = noMetas.map(b => ({...b}));
        traverseRecursively(cloned, block => {
            if (['Text', 'Button'].indexOf(block.type) > -1 && typeof block.html === 'string')
                block.html = htmlStringToVNodeArray(block.html);
        });
        this.setState({blocks: cloned});
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

/**
 * https://stackoverflow.com/a/52171480
 *
 * @param {String} str
 * @param {Number} seed = 0
 * @returns {String}
 */
function hashCode(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}


/**
 * @param {String} htmlString
 * @returns {Array<preact.ComponentChild>}
 */
function htmlStringToVNodeArray(htmlString) {
    const container = document.createElement('div');
    container.innerHTML = htmlString;
    return domNodesToVNodes(container.childNodes);
}

/**
 * @param {NodeListOf<ChildNode>} nodes
 * @returns {Array<preact.ComponentChild>}
 */
function domNodesToVNodes(nodes) {
    return [...nodes].map(node => {
        if (node.nodeType === Node.TEXT_NODE)
            return node.textContent;
        if (node.nodeType === Node.COMMENT_NODE)
            return null;
        const El = node.tagName.toLowerCase();
        const attrs = [...node.attributes].reduce((mapped, {name, value}) =>
            ({...mapped, ...{[name]: value}}),
        {});
        return <El { ...attrs }>{
            node.childNodes.length ? domNodesToVNodes(node.childNodes) : null
        }</El>;
    });
}

export default RenderAllOuter;
