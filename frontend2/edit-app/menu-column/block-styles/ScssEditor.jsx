import {__, api, Icon} from '@sivujetti-commons-for-edit-app';

class ScssEditor extends preact.Component {
    // currentCode;
    // committedCode;
    // editor;
    // saveButtonEl;
    // unregistrables;
    // emitLockIsOn;
    /**
     * @access protected
     */
    componentWillMount() {
        this.currentCode = this.props.scss;
        this.committedCode = this.currentCode;
        this.unregistrables = [];
        this.editor = null;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (!window.sivujettiUserFlags?.use014Styles)
        this.hookUpSaveButtonPosUpdateListener(this.editor.view.dom.closest('.scss-editor-outer'));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (!window.sivujettiUserFlags?.use014Styles) {
        // Auto-commit accidentally forgotten changes
        if (this.currentCode !== this.committedCode)
            this.handleCommitChangesBtnClicked();
        }
        this.unregistrables.forEach(unreg => unreg());
        this.isEditorReady = false;
    }
    /**
     * @param {{scss: String; onCommitInput: (scss: String) => void; editorId: String; collapseOuterCode?: Boolean;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.scss !== this.currentCode) {
            this.currentCode = props.scss;
            this.setCommittedCode(this.currentCode);
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
        if (window.sivujettiUserFlags?.use014Styles)
        return <div class="scss-editor-outer">
            <div ref={ el => {
                if (!el || this.editor) return;
                this.editor = window.renderCodeMirror6(el, (
                    createEditorView,
                    {defaultSettings, EditorView}
                ) => ({
                    view: createEditorView({
                        ...defaultSettings,
                        doc: this.currentCode,
                        extensions: [
                            ...defaultSettings.extensions,
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
        else
        return <div class="p-relative scss-editor-outer">
            <div ref={ el => {
                if (!el || this.editor) return;
                this.isEditorReady = false;
                this.editor = window.renderCodeMirror6(el, (
                    createEditorView,
                    {defaultSettings, EditorView, foldAllExcept, syntaxTreeAvailable}
                ) => ({
                    view: createEditorView({
                        ...defaultSettings,
                        doc: this.currentCode,
                        extensions: [
                            ...defaultSettings.extensions,
                            EditorView.updateListener.of(e => {
                                if (this.props.collapseOuterCode) {
                                    if (!this.isEditorReady) {
                                        this.isEditorReady = syntaxTreeAvailable(e.state);
                                        if (this.isEditorReady) this.collapseOuterBlocks();
                                    }
                                }
                                if (!e.docChanged)
                                    return;
                                const newCode = e.state.doc.toString();
                                this.currentCode = newCode;
                                this.updateApplyButtonVisibility(this.currentCode);
                            })
                        ]
                    }),
                    api: {foldAllExcept},
                }));
            } }></div>
            <button
                onClick={ this.handleCommitChangesBtnClicked.bind(this) }
                class="btn btn-primary btn-sm pt-1 d-none"
                title={ __('Apply changes') }>
                <Icon iconId="check" className="size-xs"/>
            </button>
        </div>;
    }
    /**
     * @access private
     */
    collapseOuterBlocks() {
        this.editor.api.foldAllExcept(this.editor.view, (_line, _range) => true);
    }
    /**
     * @access private
     */
    handleCommitChangesBtnClicked() {
        this.setCommittedCode(this.currentCode);
        this.props.onCommitInput(this.currentCode);
    }
    /**
     * @param {String} code
     * @access private
     */
    setCommittedCode(code) {
        if (!window.sivujettiUserFlags?.use014Styles) {
        this.committedCode = code;
        this.updateApplyButtonVisibility(code);
        }
    }
    /**
     * @param {String} code
     * @access private
     */
    updateApplyButtonVisibility(code) {
        if (!window.sivujettiUserFlags?.use014Styles) {
        if (code !== this.committedCode && this.saveButtonEl.classList.contains('d-none')) {
            this.saveButtonEl.classList.remove('d-none');
        } else if (code === this.committedCode && !this.saveButtonEl.classList.contains('d-none')) {
            this.saveButtonEl.classList.add('d-none');
        }
        }
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
    /**
     * @param {HTMLDivElement} editorOuterEl
     * @access private
     */
    hookUpSaveButtonPosUpdateListener(editorOuterEl) {
        const scrollEl = (
            editorOuterEl.closest('#edit-app-sections-wrapper') ||  // we're inside <BaseAndCustomClassStylesSection/>
            editorOuterEl.closest('#inspector-panel') // we're inside <BlockEditForm/>
        );
        if (!scrollEl) return;
        this.saveButtonEl = editorOuterEl.querySelector('.btn-primary');
        const referenceEl = scrollEl.querySelector('.vert-tabs').parentElement;
        const stat = {top: null, bottom: null, invalidateTimeout: null, hasScrolledPastTop: false, hasScrolledPastBottom: false};
        const updateHasScrolledPastBlockTreeBottomCls = e => {
            if (stat.top === null) {
                const rect = referenceEl.getBoundingClientRect();
                stat.top = referenceEl.offsetTop;
                stat.bottom = stat.top + rect.height;
            } else {
                clearTimeout(stat.invalidateTimeout);
                stat.invalidateTimeout = setTimeout(() => { stat.top = null; stat.bottom = null; }, 2000);
            }
            //
            const newHasScrolledPastTop = e.target.scrollTop > stat.top;
            if (newHasScrolledPastTop && !stat.hasScrolledPastTop) {
                editorOuterEl.classList.add('scrolled-past-top');
                stat.hasScrolledPastTop = true;
            } else if (!newHasScrolledPastTop && stat.hasScrolledPastTop) {
                stat.hasScrolledPastTop = false;
                editorOuterEl.classList.remove('scrolled-past-top');
            }
            const newHasScrolledPastBottom = e.target.scrollTop > stat.bottom;
            if (newHasScrolledPastBottom && !stat.hasScrolledPastBottom) {
                editorOuterEl.classList.add('scrolled-past-bottom');
                stat.hasScrolledPastBottom = true;
            } else if (!newHasScrolledPastBottom && stat.hasScrolledPastBottom) {
                stat.hasScrolledPastBottom = false;
                editorOuterEl.classList.remove('scrolled-past-bottom');
            }
        };
        scrollEl.addEventListener('scroll', updateHasScrolledPastBlockTreeBottomCls);
        this.unregistrables.push(() => {
            scrollEl.removeEventListener('scroll', updateHasScrolledPastBlockTreeBottomCls);
        });
    }
}

export default ScssEditor;
