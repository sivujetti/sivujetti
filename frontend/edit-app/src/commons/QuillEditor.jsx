const common = ['bold', 'italic', 'underline', 'strike'];
const simplest = common.concat('clean');
const simplestWithLink = common.concat('link', 'clean');

const toolbarBundles = {
    simplest: [simplest],
    simplestWithLink: [simplestWithLink],
    simple: [
        common.concat('link'),
        ['blockquote', {'list': 'ordered'}, {'list': 'bullet'}],
        [{'size': ['small', false, 'large', 'huge'] }],
        ['clean'],
    ],
    full: [
        common.concat('blockquote'),
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'indent': '-1'}, {'indent': '+1'}, {'align': [] }],
        [{'header': [1, 2, 3, 4, 5, 6, false]}],
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
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.emitChagesLockIsOn = false;
        } else {
        this.myChangeSource = 'default';
        }
    }
    /**
     * @param {String} newContents @allow raw html
     * @param {'default'|'undo'} source = 'default'
     * @access public
     */
    replaceContents(newContents, source = 'default') {
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.emitChagesLockIsOn = true;
        this.quill.clipboard.dangerouslyPasteHTML(newContents);
        this.quill.setSelection(this.quill.getLength(), 0);
        setTimeout(() => { this.emitChagesLockIsOn = false; }, 100);
        } else {
        this.myChangeSource = source;
        this.quill.clipboard.dangerouslyPasteHTML(newContents);
        this.quill.setSelection(this.quill.getLength(), 0);
        setTimeout(() => { this.myChangeSource = 'default'; }, 100);
        }
    }
    /**
     * @access protected
     */
    componentDidMount() {
        let toolbar = toolbarBundles[this.props.toolbarBundle || 'simplest'];
        if (!toolbar) toolbar = toolbarBundles['simplest'];
        //
        this.quill = new window.Quill(`#editor-${this.props.name}`, {
            modules: Object.assign({toolbar}, this.props.enableHistory === true
                ? null
                : {history: {maxStack: 0, userOnly: true,},}),
            theme: 'snow',
        });
        if (this.props.onInit) this.props.onInit(this);
        if (!window.useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        this.quill.on('text-change', (_delta, _oldDelta, _source) => {
            if (this.emitChagesLockIsOn)
                return;
            if (this.quill.container.firstChild)
                this.props.onChange(this.quill.container.firstChild.innerHTML);
        });
        } else {
        this.quill.on('text-change', (_delta, _oldDelta, _source) => {
            if (this.quill.container.firstChild)
                this.props.onChange(this.quill.container.firstChild.innerHTML,
                                    this.myChangeSource);
        });
        }
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
}

export default QuillEditor;
