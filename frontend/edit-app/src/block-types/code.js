import {__, api, env, hookForm, unhookForm, reHookValues, Textarea,
        InputErrors, FormGroup, validationConstraints} from '@sivujetti-commons-for-edit-app';

class CodeBlockEditForm extends preact.Component {
    // userCanEditCode;
    // codeInputEl;
    /**
     * @access protected
     */
    componentWillMount() {
        this.userCanEditCode = api.user.getRole() < api.user.ROLE_EDITOR;
        this.codeInputEl = preact.createRef();
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {code} = getBlockCopy();
        this.setState(hookForm(this, [
            {name: 'code', value: code, validations: [['required'], ['maxLength', validationConstraints.HARD_LONG_TEXT_MAX_LEN]], label: __('Code'),
             onAfterValueChanged: (value, hasErrors) => { emitValueChanged(value, 'code', hasErrors, env.normalTypingDebounceMillis, 'debounce-re-render-and-commit-to-queue'); }},
        ]));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.code !== block.code)
                reHookValues(this, [{name: 'code', value: block.code}]);
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (!this.userCanEditCode) return;
        const textareaEl = this.codeInputEl.current.inputEl.current;
        window.autosize(textareaEl);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @access protected
     */
    render() {
        return <div class="form-horizontal pt-0">
            <FormGroup>
                { this.userCanEditCode ? [
                    <label htmlFor="code" class="form-label">{ __('Code') }</label>,
                    <Textarea vm={ this } prop="code" id="code" class="form-input code" placeholder={ `<div>${__('My code ...')}</div>` } ref={ this.codeInputEl }/>,
                    <InputErrors vm={ this } prop="code"/>
                ] : <div class="color-dimmed">{ __('You lack permissions to edit this content.') }</div> }
            </FormGroup>
        </div>;
    }
}

export default () => {
    const initialData = {code: ''};
    const name = 'Code';
    return {
        name,
        friendlyName: name,
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'code',
        reRender({code, styleClasses, id}, renderChildren) {
            return {
                html: ['<div class="j-', name, styleClasses ? ` ${styleClasses}` : '',
                        '" data-block-type="', name, '" data-block="', id, '">',
                    code || __('Waits for configuration ...'),
                    renderChildren(),
                '</div>'].join(''),
                onAfterInsertedToDom: code => {
                    const iframeHead = api.webPageIframe.getEl().contentDocument.head;
                    // Remove previous injections (if any)
                    Array.from(iframeHead.querySelectorAll(`[data-injected-by-sivujetti-code-block="${id}"]`)).forEach(el => {
                        iframeHead.removeChild(el);
                    });
                    // Inject again
                    const temp = document.createElement('div');
                    temp.innerHTML = code;
                    Array.from(temp.querySelectorAll('script')).forEach(el => {
                        injectScript(el, iframeHead, [{name: 'data-injected-by-sivujetti-code-block', value: id}]);
                    });
                }
            };
        },
        createSnapshot: from => ({
            code: from.code,
        }),
        editForm: CodeBlockEditForm,
    };
};

/**
 * @param {HTMLScriptElement} original
 * @param {HTMLElement} toEl
 * @param {Array<{name: String; value: String;}>} extraAttrs
 */
function injectScript(original, toEl, extraAttrs = []) {
    const inject = document.createElement('script');
    // https://stackoverflow.com/a/47614491
    Array.from(original.attributes).concat(extraAttrs).forEach(attr => {
        inject.setAttribute(attr.name, attr.value);
    });
    if (original.innerHTML)
        inject.innerHTML = original.innerHTML;
    toEl.appendChild(inject);
}
