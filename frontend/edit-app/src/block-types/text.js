import {__, api, env, hookForm, unhookForm, InputErrors, FormGroup,
        validationConstraints, signals} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../quill/QuillEditor.jsx';
import setFocusTo from './auto-focusers.js';

let currentInstance;
let currentHoveredNodeInfo;

signals.on('sub-highlight-rect-revealed', (childIdx, _rect, blockEl) => {
    currentHoveredNodeInfo = {childIdx, blockEl};
    if (currentInstance) currentInstance.maybeHighlightEditorNode(currentHoveredNodeInfo);
});

signals.on('sub-highlight-rect-removed', (_subEl, _blockEl) => {
    if (currentInstance) currentInstance.maybeUnHighhlightEditorNode(currentHoveredNodeInfo);
    currentHoveredNodeInfo = null;
});

signals.on('web-page-click-received', _blockEl => {
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
        if (info.blockEl.getAttribute('data-block') !== this.props.blockId)
            return;
        const inspectorPanelEl = api.inspectorPanel.getEl();
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
        if (info.blockEl.getAttribute('data-block') !== this.props.blockId)
            return;
        this.getNthEditorNode(info.childIdx).setAttribute('data-hovered', 'y');
    }
    /**
     * @param {HoverNodeInfo} info
     * @access public
     */
    maybeUnHighhlightEditorNode(info) {
        if (info.blockEl.getAttribute('data-block') !== this.props.blockId)
            return;
        const cur = this.editor.current.quill.root.querySelector(':scope > [data-hovered]');
        if (cur) cur.removeAttribute('data-hovered');
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        this.editor = preact.createRef();
        const {html, id} = getBlockCopy();
        this.editorId = `text-${id}`;
        this.initialHtml = html;
        this.setState(hookForm(this, [
            {name: 'html', value: html, validations: [['required'], ['maxLength', validationConstraints.MAX_PROSE_HTML_LENGTH]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors, source) => { if (source !== 'undo') emitValueChanged(value, 'html', hasErrors, env.normalTypingDebounceMillis); }},
        ]));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.html !== block.html)
                this.editor.current.replaceContents(block.html, 'undo');
        });
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
     * @param {QuillEditor} instance
     * @access private
     */
    addEditorNodeMouseListeners(instance) {
        const {root} = instance.quill;
        let hovered = null;
        root.addEventListener('click', () => {
            if (hovered)
                api.webPageIframe.scrollToElement(getChildNodeIdx(hovered, root), this.props.blockId);
        });
        root.addEventListener('mouseover', e => {
            if (hovered) {
                const b = e.target;
                const hasChanged = b !== hovered && b.parentElement === root;
                if (hasChanged) {
                    api.webPageIframe.unHighlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.blockId);
                    hovered = e.target;
                    api.webPageIframe.highlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.blockId);
                }
            } else {
                hovered = e.target;
                api.webPageIframe.highlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.blockId);
            }
        }, true);
        //
        root.addEventListener('mouseleave', () => {
            if (hovered) {
                api.webPageIframe.unHighlightTextBlockChildEl(getChildNodeIdx(hovered, root), this.props.blockId);
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
 * @typedef HoverNodeInfo
 * @prop {Number} childIdx
 * @prop {HTMLDivElement} blockEl
 */

export default () => {
    const initialData = {html: `<p>${__('Text content')}</p>`};
    const name = 'Text';
    return {
        name,
        friendlyName: 'Text',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'blockquote',
        reRender: ({html, id, styleClasses}, renderChildren) =>
            ['<div class="j-', name, styleClasses ? ` ${styleClasses}` : '',
                '" data-block-type="', name, '" data-block="', id, '">',
                html,
                renderChildren(),
            '</div>'].join('')
        ,
        createSnapshot: from => ({
            html: from.html,
        }),
        editForm: TextBlockEditForm,
    };
};
