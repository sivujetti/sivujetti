import {env, timingUtils} from '@sivujetti-commons-for-edit-app';

class ScssEditor extends preact.Component {
    // scssLocal;
    // editor;
    /**
     * @access protected
     */
    componentWillMount() {
        this.scssLocal = this.props.scss;
        this.handleChangeSlow = timingUtils.debounce(
            code => this.handleChangeFast(code, 'commit-direct'),
            env.normalTypingDebounceMillis
        );
    }
    /**
     * @param {{scss: String; handleInput(codeInput: String): void;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.scss !== this.scssLocal) {
            this.scssLocal = props.scss;
            this.overwriteEditorCode(props.scss);
        }
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
        return <div class="p-relative">
            <div ref={ el => {
                if (!el || this.editor) return;
                this.editor = window.renderCodeMirror6(el, (defaultSettings, {EditorView}) => ({
                    ...defaultSettings,
                    ...{
                        doc: this.scssLocal,
                        extensions: [
                            ...defaultSettings.extensions,
                            EditorView.updateListener.of(e => {
                                if (!e.docChanged)
                                    return;
                                const newCode = e.state.doc.toString();
                                if (!this.origin) {
                                    this.handleChangeFast(newCode, 'fast-direct');
                                    this.handleChangeSlow(newCode);
                                } else
                                    this.handleChangeFast(newCode, this.origin);
                            })
                        ]
                    }
                })).view;
            } }></div>
        </div>;
    }
    /**
     * @param {String} newCode
     * @param {'fast-direct'|'slow-direct'|'undo-or-redo'} origin = null
     * @access private
     */
    handleChangeFast(newCode, origin = null) {
        this.scssLocal = newCode;
        if (origin === 'commit-direct')
            this.props.handleInput(newCode);
    }
    /**
     * @param {String} scss
     * @access private
     */
    overwriteEditorCode(scss) {
        this.origin = 'undo-or-redo';
        this.editor.dispatch({
            changes: {from: 0, to: this.editor.state.doc.length, insert: scss}
        });
        setTimeout(() => {
            this.origin = null;
        }, 100);
    }
}

export default ScssEditor;
