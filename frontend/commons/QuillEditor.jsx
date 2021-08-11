const toolbarBundles = {
    simplest: [
        ['bold', 'italic', 'underline', 'strike'],
    ],
    full: [
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
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
     * @param {{name: String; value: String; onChange: (html: String) => any; onBlur?: () => any; toolbarBundle?: String; onInit?: (editor: QuillEditor) => any;}} props
     */
    constructor(props) {
        super(props);
        this.quill = null;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        let toolbar = toolbarBundles[this.props.toolbarBundle || 'simplest'];
        if (!toolbar) toolbar = toolbarBundles['simplest'];
        //
        this.quill = new window.Quill(`#editor-${this.props.name}`, {
            modules: {toolbar},
            theme: 'snow'
        });
        if (this.props.onInit) this.props.onInit(this);
        this.quill.on('text-change', (_delta, _oldDelta, _source) => {
            if (this.quill.container.firstChild)
                this.props.onChange(this.quill.container.firstChild.innerHTML);
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
}

export default QuillEditor;
