import {env, http, urlAndSlugUtils, urlUtils} from '@sivujetti-commons-for-web-pages';
import {completeImageSrc} from '../shared-inline.js';
import {htmlStringToVNodeArray} from './ReRenderingWebPageFuncs.js';
import {
    addButtonCommonCss,
    buttonCommonCss,
    contentColor,
    contentColorHover,
    plusIcon,
    rowColor,
    rowColorHover,
} from './in-context-editing.js';

/** @type {MessagePort} */
let messagePortToEditApp;

/**
 * @param {MessagePort} port
 */
function setMessagePort(port) {
    messagePortToEditApp = port;
}

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
    // codeQueuedForExecution;
    // codeLastExecuted;
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, createDefaultProps}) {
        if (this.codeLastExecuted !== block.code) {
            this.codeQueuedForExecution = block.code;
        }
        return <div
            { ...createDefaultProps() }
            dangerouslySetInnerHTML={ {
                __html: block.code || __('Waits for configuration ...'),
            } }
            ref={ el => {
                if (!el || !this.codeQueuedForExecution) return;
                [...el.querySelectorAll('script')].forEach(el => executeCodeIn(el));
                this.codeLastExecuted = this.codeQueuedForExecution;
                this.codeQueuedForExecution = null;
            } }></div>;
    }
}

/**
 * @param {HTMLScriptElement} tag
 * @param {Array<{name: string; value: string;}>} extraAttrs
 */
function executeCodeIn(tag, extraAttrs = []) {
    const clone = document.createElement('script');
    [...tag.attributes, ...extraAttrs].forEach(attr => {
        clone.setAttribute(attr.name, attr.value);
    });
    clone.innerHTML = tag.innerHTML;
    tag.replaceWith(clone);
}

class ColumnsBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}) {
        const numCols = block.numColumns || 1;
        const {config} = block;
        const alignClass = {
            'start': 'align-top',
            'center': 'align-center',
            'end': 'align-bottom',
        }[config.alignY] || '';
        const extraClasses = [
            ...(block.isRow ? ['is-row'] : []),
            ...(numCols > 1 ? [`num-cols-${numCols}`] : []),
            ...(config.takeFullWidth === 0 ? ['d-inline-grid'] : []),
            ...(alignClass ? [alignClass] : []),
        ].join(' ');
        return <div { ...createDefaultProps(extraClasses) }>
            { renderChildren() }
        </div>;
    }
}

class PlaceholderBlock extends preact.Component {
    constructor(props) {
        super(props);
        /** @type {ShadowRoot} */
        this.shadow = null;
    }
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, createDefaultProps}) {
        return <span { ...createDefaultProps() } ref={ el => {
            if (!el) return;
            if (this.shadow) {
                this.shadow.querySelector('button').remove();
                this.shadow.appendChild(createAddButton(block));
                return;
            }
            const shadow = el.attachShadow({mode: 'open'});
            const sheet = new CSSStyleSheet();
            const isContentPlaceholder = block.outerBlockType === 'Columns';
            const [color, hoverColor] = isContentPlaceholder ? [contentColor, contentColorHover] : [rowColor, rowColorHover];
            sheet.replaceSync([
                'button { ', buttonCommonCss, addButtonCommonCss, ' height: 16px; padding: 1px 6px; background: ', color, '; ', ' } ',
                'button svg { width: 14px; height: 14px; } ',
                'button:hover { background: ', hoverColor, '; }',
            ].join(''));
            shadow.adoptedStyleSheets = [sheet];

            shadow.appendChild(createAddButton(block));
            this.shadow = shadow;
        } }></span>;
    }
}

/**
 * @param {Block} block
 * @access protected
 */
function createAddButton(block) {
    const button = document.createElement('button');
    button.innerHTML = plusIcon;
    const isContentPlaceholder = block.outerBlockType === 'Columns';
    button.title = isContentPlaceholder ? 'Add content or row' : 'Add row';
    button.addEventListener('click', e => {
        e.stopPropagation();
        messagePortToEditApp.postMessage(['onAddContentOrRowButtonClicked',
            {insertType: isContentPlaceholder ? 'content' : 'row'},
            block.id,
            button.getBoundingClientRect()]);
    });
    return button;
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

class ListingBlock extends preact.Component {
    // cachedRenders;
    // prevFetchAborter;
    /**
     * @access protected
     */
    componentWillMount() {
        this.cachedRenders = new Map;
        this.setState({content: __('Loading ...'), contentHash: '@waiting'});
        const {block} = this.props;
        this.renderCacheAndSetToState(block, createHash(block));
    }
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {block} = props;
        const maybeChanged = createHash(block);
        if (maybeChanged !== this.state.contentHash) {
            const fromCache = this.cachedRenders.get(maybeChanged);
            if (!fromCache) this.renderCacheAndSetToState(block, maybeChanged);
            else this.setState({content: fromCache, contentHash: maybeChanged});
        }
    }
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({block, renderChildren, createDefaultProps}, {content}) {
        return <div { ...createDefaultProps(`page-type-${block.filterPageType.toLowerCase()}`) }>
            { content }
            { renderChildren() }
        </div>;
    }
    /**
     * @param {Block} block
     * @param {AbortController} abortCtrl
     * @returns {Promise<Array<preact.ComponentChild>|preact.ComponentChild>|null}
     * @access private
     */
    async renderInBackend(block, abortCtrl) {
        try {
            const {__pages, __pageType, ...rest} = block;
            const resp = await http.post('/api/blocks/render', {block: rest}, {signal: abortCtrl.signal});
            this.prevFetchAborter = null;
            const withWrapperDiv = htmlStringToVNodeArray(resp.result);
            const divChildren = withWrapperDiv[0].props.children;
            return divChildren;
        } catch (err) {
            this.prevFetchAborter = null;
            if (err === '@overridden-by-renderer')
                return null;
            env.window.console.error(err);
            return <p>{ __('Failed to render content.') }</p>;
        }
    }
    /**
     * @param {Block} block
     * @param {string} contentHash
     * @access private
     */
    async renderCacheAndSetToState(block, contentHash) {
        if (this.prevFetchAborter)
            this.prevFetchAborter.abort('@overridden-by-renderer');
        this.prevFetchAborter = new AbortController();
        const htmlArr = await this.renderInBackend(block, this.prevFetchAborter);
        if (!htmlArr) return; // abortet
        this.cachedRenders.set(contentHash, htmlArr);
        this.setState({content: htmlArr, contentHash});
    }
}
/**
 * @param {Block} block
 * @returns {string}
 */
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
 * @param {number} depth = 0
 * @returns {preact.VNode}
 */
function menuPrintBranch(branch, block, depth = 0) {
    const currentPageSlug = '-';
    return <ul class={ `level-${depth}` }>{ branch.map(({slug, text, children, includeToggleButton}) => {
        const hasChildrenCls = !children.length ? '' : ' has-children';
        return <li
            class={ `level-${depth}${hasChildrenCls}` }
            { ...(slug === currentPageSlug ? {'data-current': 'true'} : {}) }>
            <a href={ urlAndSlugUtils.getCompletedUrl(slug) }>
                { text }
            </a>
            { hasChildrenCls
                ? [
                    ...(!includeToggleButton ? [] : [<button
                        onClick={ e => e.target.closest('li').classList.toggle('li-open') }
                        class="btn btn-link btn-sub-nav-toggle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><polyline points="6 9 12 15 18 9"/></svg>
                    </button>]),
                    menuPrintBranch(children, block, depth + 1)
                ]
                : null
            }
        </li>;
    }) }</ul>;
}

class RootSectionBlock extends preact.Component {
    /**
     * @param {BlockRendererProps} props
     * @access protected
     */
    render({renderChildren, createDefaultProps}) {
        return <div { ...createDefaultProps() }>
            { renderChildren() }
        </div> ;
    }
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
    ContentOrRowPlaceholder: PlaceholderBlock,
    Image: ImageBlock,
    Listing: ListingBlock,
    Menu: MenuBlock,
    RootSection: RootSectionBlock,
    Section: SectionBlock,
    Text: TextBlock,
    Wrapper: WrapperBlock,
};

export default builtInRenderers;
export {setMessagePort};
