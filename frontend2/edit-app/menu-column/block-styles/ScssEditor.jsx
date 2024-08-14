class ScssEditor extends preact.Component {
    // currentCode;
    // editor;
    // emitLockIsOn;
    /**
     * @access protected
     */
    componentWillMount() {
        this.currentCode = this.props.scss;
        this.editor = null;
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.isEditorReady = false;
    }
    /**
     * @param {{scss: String; onCommitInput: (scss: String) => void; editorId: String; collapseOuterCode?: Boolean;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.scss !== this.currentCode) {
            this.currentCode = props.scss;
            this.emitLockIsOn = true;
            setTimeout(() => {
                this.emitLockIsOn = null;
            }, 400);
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
        return <div class="scss-editor-outer">
            <div ref={ el => {
                if (!el || this.editor) return;
                this.editor = window.renderCodeMirror6(el, (
                    createEditorView,
                    {defaultSettings, EditorView, excludeFirstAndLastLineFromSelection, preventFirstLastLineDeletion}
                ) => ({
                    view: createEditorView({
                        ...defaultSettings,
                        doc: this.currentCode,
                        extensions: [
                            ...defaultSettings.extensions,
                            ...(this.props.editorId === 'dev-class-styles' ? [
                                excludeFirstAndLastLineFromSelection(),
                                preventFirstLastLineDeletion()
                            ] : []),
                            EditorView.updateListener.of(e => {
                                if (!e.docChanged)
                                    return;
                                const newCode = e.state.doc.toString();
                                this.currentCode = newCode;
                                if (this.emitLockIsOn) {
                                    return;
                                }
                                if (e.transactions.some(tr => tr.isUserEvent('undo') || tr.isUserEvent('redo'))) {
                                    return;
                                }
                                this.props.onInput(this.currentCode);
                            })
                        ]
                    }),
                    api: {foldAllExcept: () => {}},
                }));
            } }></div>
        </div>;
    }
    /**
     * @access private
     */
    collapseOuterBlocks() {
        this.editor.api.foldAllExcept(this.editor.view, (_line, _range) => true);
    }
    /**
     * @param {String} code
     * @access private
     */
    overwriteEditorCode(code) {
        const {view} = this.editor;
        view.dispatch({
            changes: {from: 0, to: view.state.doc.length, insert: code}
        });
    }
}

export default ScssEditor;
