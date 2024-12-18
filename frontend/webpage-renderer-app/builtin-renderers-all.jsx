import {env, http, urlAndSlugUtils, urlUtils} from '@sivujetti-commons-for-web-pages';
import {completeImageSrc} from '../shared-inline.js';
import {htmlStringToVNodeArray,} from './ReRenderingWebPageFuncs.js';

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
        const numCols = block.numColumns ?? null;
        const extraClasses = [
            ...(numCols ? [`num-cols-${numCols}`] : []),
            ...(block.takeFullWidth === false ? ['inline'] : []),
        ].join(' ');
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
     * @returns {Promise<Array<preact.ComponentChild>>|null}
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>]),
                    menuPrintBranch(children, block, depth + 1)
                ]
                : null
            }
        </li>;
    }) }</ul>;
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

export default builtInRenderers;
