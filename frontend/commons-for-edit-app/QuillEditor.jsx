import {__, api} from './edit-app-singletons.js';
import {currentInstance as  floatingDialog} from './FloatingDialog.jsx';
import PickUrlDialog, {getHeight} from './includes-internal/PickUrlDialog.jsx';
import {determineModeFrom} from './pick-url-utils.js';

const common = ['bold', 'italic', 'underline', 'strike'];
const simplest = common.concat('clean');
const simplestWithLink = common.concat('link', 'clean');
const headingToobarItem = {'header': [1, 2, 3, 4, 5, 6, false]};

const toolbarBundles = {
    simplest: [simplest],
    simplestWithLink: [simplestWithLink],
    simple: [
        common.concat('link'),
        ['blockquote', {'list': 'ordered'}, {'list': 'bullet'}],
        [{'size': ['small', false, 'large', 'huge']}],
        ['clean'],
    ],
    longText: [
        [headingToobarItem, ...common, ...['link', 'id-anchor']],
        ['blockquote', {'list': 'ordered'}, {'list': 'bullet'}],
        [{'size': ['small', false, 'large', 'huge']}, {'align': []}],
        ['clean'],
    ],
    full: [
        common.concat('blockquote'),
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'indent': '-1'}, {'indent': '+1'}, {'align': []}],
        [headingToobarItem],
        [{'size': ['small', false, 'large', 'huge']}],
        ['link', 'id-anchor', 'image', 'video', 'code-block'],
        ['clean'],
    ]
};

/** @extends {preact.Component<{name: string; value: string; onChange: (html: string, source: 'default'|'undo'|null|undefined) => any; onBlur?: () => any; toolbarBundle?: 'simplest'|'simplestWithLink'|'full'; onInit?: (editor: QuillEditor) => any; enableHistory?: boolean;}, any>} */
class QuillEditor extends preact.Component {
    /**
     * @param {string} newContents @allow raw html
     * @param {'default'|'undo'|'my-undo'} source = 'default'
     * @access public
     */
    replaceContents(newContents, source = 'default') {
        this.myChangeSource = source;
        this.quill.clipboard.dangerouslyPasteHTML(newContents);
        this.quill.setSelection(this.quill.getLength(), 0);
        setTimeout(() => { this.myChangeSource = 'default'; }, 600);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.quill = null;
        this.myChangeSource = 'default';
        this.contentMaybeHasLinks = false;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        const type = this.props.toolbarBundle || 'simplest';
        let toolbar = api.applyFilters('quillCreateToolbarConfig', toolbarBundles[type], type);
        if (!toolbar) toolbar = api.applyFilters('quillCreateToolbarConfig', toolbarBundles['simplest'], 'simplest');
        this.contentMaybeHasLinks = toolbar.flat().indexOf('link') > -1;
        //
        this.quill = new window.Quill(`#editor-${this.props.name}`, {
            modules: {
                toolbar,
                clipboard: {matchVisual: false},
                ...(this.props.enableHistory === true
                    ? {}
                    : {history: {maxStack: 0, userOnly: true}})
            },
            theme: 'snow',
            sivujettiApi: createApi(this),
        });
        if (this.props.onInit) this.props.onInit(this);
        this.quill.on('text-change', (_delta, _oldDelta, _source) => {
            const normalized = this.getEditorHtml();
            // @ts-ignore Argument of type 'string' is not assignable to parameter of type '"default" | "undo"'
            this.props.onChange(normalized, this.myChangeSource);
        });
        if (this.props.onBlur)
            this.quill.on('selection-change', range => {
                if (!range) this.props.onBlur();
            });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.quill.theme.sivujettiApi) this.quill.theme.destroy();
    }
    /**
     * @access protected
     */
    shouldComponentUpdate() {
        return false;
    }
    /**
     * @access protected
     */
    render() {
        return <div>
            <div
                id={ `editor-${this.props.name}` }
                dangerouslySetInnerHTML={ {__html: htmlFromLocalToQuill(this.props.value)} }></div>
        </div>;
    }
    /**
     * @returns {string}
     * @access private
     */
    getEditorHtml() {
        if (!this.contentMaybeHasLinks || !this.quill.container.firstChild.querySelectorAll('a[data-href-original]').length)
            return this.quill.getSemanticHTML();
        //
        const editorEl = this.quill.container.firstChild;
        const attrsBeforePatch = Array.from(editorEl.querySelectorAll('a[data-href-original]')).map(el => {
            const hrefAttr = el.getAttribute('href');
            const urlWithoutOrigin = el.getAttribute('data-href-original');
            el.removeAttribute('data-href-original');
            el.setAttribute('href', urlWithoutOrigin);
            return {hrefAttr, urlWithoutOrigin, el};
        });
        const out = this.quill.getSemanticHTML();
        attrsBeforePatch.forEach(({hrefAttr, urlWithoutOrigin, el}) => {
            el.setAttribute('href', hrefAttr);
            el.setAttribute('data-href-original', urlWithoutOrigin);
        });
        return out;
    }
}

/**
 * @param {QuillEditor} self
 * @returns {{openUrlPicker(linkText: string, url: string): void; rebuild(): void;}}
 */
function createApi(self) {
    return {
        openUrlPicker(_linkText, url) {
            const mode = determineModeFrom(url)[0];
            const norm = url.split('_edit')[1] || url; // '/sivujetti/index.php?q=/_edit#foo' -> '#foo'
                                                        // '/sivujetti/index.php?q=/_edit' -> ''
            floatingDialog.open(PickUrlDialog, {
                title: __('Choose a link'),
                width: 480,
                // @ts-ignore Argument of type '"default"' is not assignable to parameter of type 'urlMode'
                height: getHeight('default')[0],
            }, {
                mode,
                url: norm,
                dialog: floatingDialog,
                onConfirm: url2 => {
                    const {quill} = self;
                    const {scrollTop} = quill.root;
                    const url3 = url2 || '-';
                    if (quill.theme.tooltip.linkRange) {
                        quill.formatText(quill.theme.tooltip.linkRange, 'link', url3, window.Quill.sources.USER);
                        delete quill.theme.tooltip.linkRange;
                    } else {
                        quill.theme.tooltip.restoreFocus();
                        quill.format('link', url3, window.Quill.sources.USER);
                    }
                    quill.root.scrollTop = scrollTop;
                },
            });
        },
        rebuild() {
            self.quill.theme.modules.toolbar.container.remove();
            self.quill.theme.tooltip.root.remove();
            setTimeout(() => {
                self.componentDidMount();
            }, 400);
        },
    };
}

/**
 * @param {string} html
 * @returns {string}
 */
function htmlFromLocalToQuill(html) {
    return html.replace(/href=""/g, 'href="-"');
}

export default QuillEditor;
