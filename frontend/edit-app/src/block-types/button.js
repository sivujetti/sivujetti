import {urlUtils, __, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroup, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import QuillEditor from '../commons/QuillEditor.jsx';
import {formValidation} from '../constants.js';
import {unParagraphify} from './paragraph.js';
import setFocusTo from './auto-focusers.js';

class ButtonBlockEditForm extends preact.Component {
    // editor;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        this.editor.current.replaceContents(snapshot.html);
        reHookValues(this, [{name: 'linkTo', value: snapshot.linkTo},
                            {name: 'cssClass', value: snapshot.cssClass}]);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.editor = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'html', value: block.html, validations: [['required'], ['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Content'), onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'html', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'linkTo', value: block.linkTo, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'linkTo', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ]));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.editor);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({block}) {
        if (!this.state.values) return;
        return <>
            <FormGroup>
                <QuillEditor
                    name="html"
                    value={ block.html }
                    onChange={ markup => {
                        this.inputApis.html.triggerInput(unParagraphify(markup));
                    } }
                    onBlur={ e => this.inputApis.html.onBlur(e) }
                    toolbarBundle="simplest"
                    ref={ this.editor }/>
                <InputErrors vm={ this } prop="html"/>
            </FormGroup>
            <div class="form-horizontal pt-0">
                <FormGroupInline>
                    <label htmlFor="linkTo" class="form-label">{ __('Link') }</label>
                    <Input vm={ this } prop="linkTo"/>
                    <InputErrors vm={ this } prop="linkTo"/>
                </FormGroupInline>
                <FormGroupInline>
                    <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                    <Input vm={ this } prop="cssClass"/>
                    <InputErrors vm={ this } prop="cssClass"/>
                </FormGroupInline>
            </div>
        </>;
    }
}

export default () => {
    const initialData = {html: `${__('Button text')}`, linkTo: '/', cssClass: ''};
    return {
        name: 'Button',
        friendlyName: 'Button',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'hand-finger',
        reRender({html, linkTo, cssClass}, renderChildren) {
            const href = linkTo.indexOf('.') < 0
                ? urlUtils.makeUrl(linkTo)
                : `${linkTo.startsWith('//') || linkTo.startsWith('http') ? '' : '//'}${linkTo}`;
            return ['<p class="button">',
                '<a href="', href, '" class="btn', (cssClass ? ` ${cssClass}` : ''), '" data-block-root>',
                    html,
                    renderChildren(),
                '</a>',
            '</p>'].join('');
        },
        createSnapshot: from => ({
            html: from.html,
            linkTo: from.linkTo,
            cssClass: from.cssClass,
        }),
        editForm: ButtonBlockEditForm,
    };
};
