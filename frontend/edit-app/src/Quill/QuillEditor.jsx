import {__, floatingDialog} from '@sivujetti-commons-for-edit-app';
import PickUrlDialog, {getHeight} from '../popups/PickUrlDialog.jsx';
import {determineModeFrom} from './common.js';

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
        [{'size': ['small', false, 'large', 'huge'] }],
        ['clean'],
    ],
    longText: [
        [headingToobarItem, ...common, ...['link']],
        ['blockquote', {'list': 'ordered'}, {'list': 'bullet'}],
        ['clean'],
    ],
    full: [
        common.concat('blockquote'),
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'indent': '-1'}, {'indent': '+1'}, {'align': [] }],
        [headingToobarItem],
        [{'size': ['small', false, 'large', 'huge'] }],
        ['link', 'image', 'video', 'code-block'],
        ['clean'],
    ]
};

class QuillEditor extends preact.Component {
    /**
     * @param {{name: String; value: String; onChange: (html: String) => any; onBlur?: () => any; toolbarBundle?: 'simplest'|'simplestWithLink'|'full'; onInit?: (editor: QuillEditor) => any;}} props
     */
    constructor(props) {
        super(props);
        this.quill = null;
        this.myChangeSource = 'default';
    }
    /**
     * @param {String} newContents @allow raw html
     * @param {'default'|'undo'} source = 'default'
     * @access public
     */
    replaceContents(newContents, source = 'default') {
        this.myChangeSource = source;
        this.quill.clipboard.dangerouslyPasteHTML(newContents);
        this.quill.setSelection(this.quill.getLength(), 0);
        setTimeout(() => { this.myChangeSource = 'default'; }, 100);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        let toolbar = toolbarBundles[this.props.toolbarBundle || 'simplest'];
        if (!toolbar) toolbar = toolbarBundles['simplest'];
        this.contentMaybeHasLinks = toolbar.flat().indexOf('link') > -1;
        //
        const dhis = this;
        this.quill = new window.Quill(`#editor-${this.props.name}`, {
            modules: Object.assign({toolbar}, this.props.enableHistory === true
                ? null
                : {history: {maxStack: 0, userOnly: true,},}),
            theme: 'snow',
            sivujettiApi: {openUrlPicker(_linkText, url) {
                const [mode, title] = determineModeFrom(url);
                floatingDialog.open(PickUrlDialog, {
                    title,
                    width: 514,
                    height: getHeight('default')[0],
                }, {
                    mode,
                    url,
                    dialog: floatingDialog,
                    onConfirm: url2  => {
                        const {quill} = dhis;
                        var scrollTop = quill.root.scrollTop;
                        if (quill.theme.tooltip.linkRange) {
                            quill.formatText(quill.theme.tooltip.linkRange, 'link', url2, window.Quill.sources.USER);
                            delete quill.theme.tooltip.linkRange;
                        } else {
                            quill.theme.tooltip.restoreFocus();
                            quill.format('link', url2, window.Quill.sources.USER);
                        }
                        quill.root.scrollTop = scrollTop;
                    },
                });
            }},
        });
        if (this.props.onInit) this.props.onInit(this);
        this.quill.on('text-change', (_delta, _oldDelta, _source) => {
            const normalized = this.getEditorHtml();
            if (this.quill.container.firstChild)
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
     * @returns {String}
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
