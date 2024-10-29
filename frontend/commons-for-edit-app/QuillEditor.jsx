import {__} from './edit-app-singletons.js';
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

class QuillEditor extends preact.Component {
    // quill;
    // myChangeSource;
    // contentMaybeHasLinks;
    /**
     * @param {{name: string; value: string; onChange: (html: string, source: 'default'|'undo'|null|undefined) => any; onBlur?: () => any; toolbarBundle?: 'simplest'|'simplestWithLink'|'full'; onInit?: (editor: QuillEditor) => any;}} props
     */
    constructor(props) {
        super(props);
        this.quill = null;
        this.myChangeSource = 'default';
    }
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
    componentDidMount() {
        let toolbar = toolbarBundles[this.props.toolbarBundle || 'simplest'];
        if (!toolbar) toolbar = toolbarBundles['simplest'];
        this.contentMaybeHasLinks = toolbar.flat().indexOf('link') > -1;
        //
        const self = this;
        const modulesBase = {toolbar, clipboard: {matchVisual: false}};
        this.quill = new window.Quill(`#editor-${this.props.name}`, {
            modules: Object.assign(modulesBase, this.props.enableHistory === true
                ? null
                : {history: {maxStack: 0, userOnly: true,},}),
            theme: 'snow',
            sivujettiApi: {openUrlPicker(_linkText, url) {
               const mode = determineModeFrom(url)[0];
               const norm = url.split('_edit')[1] || url; // '/sivujetti/index.php?q=/_edit#foo' -> '#foo'
                                                          // '/sivujetti/index.php?q=/_edit' -> ''
               floatingDialog.open(PickUrlDialog, {
                   width: 480,
                   height: getHeight('default', true)[0],
                   title: __('Choose a link')
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
            }},
        });
        if (this.props.onInit) this.props.onInit(this);
        this.quill.on('text-change', (_delta, _oldDelta, _source) => {
            const normalized = this.getEditorHtml();
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
            <div id={ `editor-${this.props.name}` } dangerouslySetInnerHTML={ {__html: this.props.value} }></div>
        </div>;
    }
    /**
     * @returns {string}
     * @access private
     */
    getEditorHtml() {
        if (!this.contentMaybeHasLinks || !this.quill.container.firstChild.querySelectorAll('a[data-href-original]').length)
            return this.quill.container.firstChild.innerHTML;
        //
        const copy = this.quill.container.firstChild.cloneNode(true);
        Array.from(copy.querySelectorAll('a[data-href-original]')).forEach(el => {
            const urlWithoutOrigin = el.getAttribute('data-href-original');
            el.removeAttribute('data-href-original');
            el.setAttribute('href', urlWithoutOrigin);
        });
        return copy.innerHTML;
    }
}

export default QuillEditor;
