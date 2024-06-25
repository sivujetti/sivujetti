import {__, Icon} from '@sivujetti-commons-for-edit-app';

class ScssEditor extends preact.Component {
    // currentCode;
    // committedCode;
    // editor;
    // saveButtonEl;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        this.currentCode = this.props.scss;
        this.committedCode = this.currentCode;
        this.unregistrables = [];
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.hookUpSaveButtonPosUpdateListener(this.editor.dom.closest('.scss-editor-outer'));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        // Auto-commit accidentally forgotten changes
        if (this.currentCode !== this.committedCode)
            this.handleCommitChangesBtnClicked();
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {{scss: String; onCommitInput(scss: String): void;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.scss !== this.currentCode) {
            this.currentCode = props.scss;
            this.setCommittedCode(this.currentCode);
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
        return <div class="p-relative scss-editor-outer">
            <div ref={ el => {
                if (!el || this.editor) return;
                this.editor = window.renderCodeMirror6(el, (defaultSettings, {EditorView}) => ({
                    ...defaultSettings,
                    ...{
                        doc: this.currentCode,
                        extensions: [
                            ...defaultSettings.extensions,
                            EditorView.updateListener.of(e => {
                                if (!e.docChanged)
                                    return;
                                const newCode = e.state.doc.toString();
                                this.currentCode = newCode;
                                this.setCommittedCode(this.currentCode);
                            })
                        ]
                    }
                })).view;
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
    handleCommitChangesBtnClicked() {
        this.setCommittedCode(this.currentCode);
        this.props.onCommitInput(this.currentCode);
    }
    /**
     * @param {String} code
     * @access private
     */
    setCommittedCode(code) {
        this.committedCode = code;
        if (code !== this.committedCode && this.saveButtonEl.classList.contains('d-none')) {
            this.saveButtonEl.classList.remove('d-none');
        } else if (code === this.committedCode && !this.saveButtonEl.classList.contains('d-none')) {
            this.saveButtonEl.classList.add('d-none');
        }
    }
    /**
     * @param {String} code
     * @access private
     */
    overwriteEditorCode(code) {
        this.editor.dispatch({
            changes: {from: 0, to: this.editor.state.doc.length, insert: code}
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
