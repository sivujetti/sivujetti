import {env, http, urlAndSlugUtils, urlUtils} from '@sivujetti-commons-for-web-pages';
import {completeImageSrc,} from '../shared-inline.js';
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
    render({block, renderChildren, createDefaultProps}, {renderedHtmlAsArr}) {
        return <div { ...createDefaultProps(`page-type-${block.filterPageType.toLowerCase()}`) }>
            { renderedHtmlAsArr || __('Loading ...') }
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

export default builtInRenderers;