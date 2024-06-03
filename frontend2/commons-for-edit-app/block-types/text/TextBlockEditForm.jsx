import {validationConstraints} from '../../constants.js';
import {__, api, events} from '../../edit-app-singletons.js';
import {
    FormGroup,
    hookForm,
    InputErrors,
    unhookForm,
} from '../../Form.jsx';
import QuillEditor from '../../QuillEditor.jsx';
import setFocusTo from '../../auto-focusers.js';
import {getNormalizedInitialHoverCandidate} from '../../../shared-inline.js';

let currentInstance;
let currentHoveredNodeInfo;

events.on('web-page-text-block-child-el-hover-started', (childIdx, blockId) => {
    currentHoveredNodeInfo = {childIdx, blockId};
    if (currentInstance) currentInstance.maybeHighlightEditorNode(currentHoveredNodeInfo);
});

events.on('web-page-text-block-child-el-hover-ended', () => {
    if (currentInstance) currentInstance.doUnHighlightEditorNode();
    currentHoveredNodeInfo = null;
});

events.on('web-page-click-received', _blockEl => {
    if (currentInstance && currentHoveredNodeInfo)
        currentInstance.maybeScrollToEditorNode(currentHoveredNodeInfo);
});

class TextBlockEditForm extends preact.Component {
    // editor;
    // editorId;
    // initialHtml;
    /**
     * @param {HoverNodeInfo} info
     * @access public
     */
    maybeScrollToEditorNode(info) {
        if (info.blockId !== this.props.block.id) return;
        const inspectorPanelEl = api.inspectorPanel.getOuterEl();
        const toolbarHeight = this.editor.current.quill.theme.modules.toolbar.container.getBoundingClientRect().height;
        const subEl = this.getNthEditorNode(info.childIdx);
        inspectorPanelEl.scrollTo({
            top: subEl.getBoundingClientRect().top - toolbarHeight + inspectorPanelEl.scrollTop - inspectorPanelEl.getBoundingClientRect().top,
            behavior: 'smooth',
        });
    }
    /**
     * @param {HoverNodeInfo} info
     * @access public
     */
    maybeHighlightEditorNode(info) {
        if (info.blockId !== this.props.block.id) return;
        this.getNthEditorNode(info.childIdx).setAttribute('data-hovered', 'y');
    }
    /**
     * @param {HoverNodeInfo} info
     * @access public
     */
    maybeUnHighlightEditorNode(info) {
        if (info.blockId !== this.props.block.id) return;
        this.doUnHighlightEditorNode();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, emitValueChangedThrottled} = this.props;
        this.editor = preact.createRef();
        const {id, html} = block;
        this.editorId = `text-${id}`;
        this.initialHtml = html;
        this.setState(hookForm(this, [
            {name: 'html', value: html, validations: [['required'], ['maxLength', validationConstraints.MAX_PROSE_HTML_LENGTH]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors, source) => {
                emitValueChangedThrottled(value, 'html', hasErrors, source);
            }},
        ]));
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.block !== this.props.block && props.lastBlockTreeChangeEventInfo.isUndoOrRedo &&
            this.props.block.html !== props.block.html) {
            this.editor.current.replaceContents(
                props.block.html,
                props.lastBlockTreeChangeEventInfo.ctx
            );
        }
    }
    /**
     * @access protected
     */
    componentDidMount() {
       setFocusTo(this.editor);
        if (currentHoveredNodeInfo)
            this.maybeScrollToEditorNode(currentHoveredNodeInfo);
        currentInstance = this;
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        currentInstance = null;
        unhookForm(this);
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render() {
        return <FormGroup>
           <QuillEditor
               name={ this.editorId }
               value={ this.initialHtml }
               onInit={ this.addEditorNodeMouseListeners.bind(this) }
               onChange={ (markup, source) => {
                   this.inputApis.html.triggerInput(markup, source);
               } }
               onBlur={ e => this.inputApis.html.onBlur(e) }
               toolbarBundle="longText"
               ref={ this.editor }/>
            <InputErrors vm={ this } prop="html"/>
        </FormGroup>;
    }
    /**
     * @param {Number} idx
     * @access private
     */
    getNthEditorNode(idx) {
        return this.editor.current.quill.root.children[idx];
    }
    /**
     * @access private
     */
    doUnHighlightEditorNode() {
        const cur = this.editor.current.quill.root.querySelector(':scope > [data-hovered]');
        if (cur) cur.removeAttribute('data-hovered');
    }
    /**
     * @param {QuillEditor} instance
     * @access private
     */
    addEditorNodeMouseListeners(instance) {
        const {root} = instance.quill;
        let hovered = null;
        root.addEventListener('click', () => {
            if (hovered) {
                api.webPagePreview.scrollToTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.block.id);
                setTimeout(() => {
                    if (hovered)
                        api.webPagePreview.highlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.block.id);
                }, 100);
            }
        });
        root.addEventListener('mouseover', e => {
            if (hovered) {
                const b = e.target;
                const hasChanged = b !== hovered && b.parentElement === root;
                if (hasChanged) {
                    api.webPagePreview.unHighlightTextBlockChildEl();
                    hovered = e.target;
                    api.webPagePreview.highlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.block.id);
                }
            } else {
                const candidate = getNormalizedInitialHoverCandidate(e.target, root);
                if (candidate !== root) {
                    hovered = candidate;
                    api.webPagePreview.highlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.block.id);
                }
            }
        }, true);
        //
        root.addEventListener('mouseleave', () => {
            if (hovered) {
                api.webPagePreview.unHighlightTextBlockChildEl();
                hovered = null;
            }
        }, true);
    }
}

/**
 * @param {HTMLElement} node Child node of .ql-editor
 * @param {HTMLDivElement} paren .ql-editor
 * @returns {Number}
 */
function getChildNodeIdx(node, paren) {
    return Array.from(paren.children).indexOf(node);
}

/**
 * @typedef TextBlockProps
 * @prop {String} html
 */

export default TextBlockEditForm;
