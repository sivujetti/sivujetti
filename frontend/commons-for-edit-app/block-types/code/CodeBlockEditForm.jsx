import { getMetaKey } from '../../../shared-inline.js';
import setFocusTo from '../../auto-focusers.js';
import {validationConstraints} from '../../constants.js';
import {__, api} from '../../edit-app-singletons.js';
import {
    FormGroup,
    hookForm,
    InputErrors,
    reHookValues,
    Textarea,
    unhookForm,
} from '../../Form.jsx';
import {Icon} from '../../Icon.jsx';

const saveBtnEdgeCssStr = '.2rem';

class CodeBlockEditForm extends preact.Component {
    // userCanEditCode;
    // codeInputEl;
    // saveBtnEl;
    // keyHandlers;
    // unregisterScrollListner;
    /**
     * @access protected
     */
    componentWillMount() {
        this.userCanEditCode = api.user.getRole() <= api.user.ROLE_ADMIN_EDITOR;
        this.codeInputEl = preact.createRef();
        this.saveBtnEl = preact.createRef();
        this.keyHandlers = createUndoRedoKeyPressPropagationStopperHandlers();
        const {block} = this.props;
        this.setState(hookForm(this, [
            {name: 'code', value: block.code, validations: [['required'], ['maxLength', validationConstraints.HARD_LONG_TEXT_MAX_LEN]],
             label: __('Code'), onAfterValueChanged: (value, _hasErrors, _source) => {
                const willUnreveal = this.saveBtnEl.current?.classList.contains('d-invisible') && value !== this.state.committedCode;
                if (willUnreveal && !this.adjustBntInitiallyTimeout) {
                    this.adjustBntInitiallyTimeout = setTimeout(() => {
                        this.adjustSaveChangesBtnEl();
                        this.adjustBntInitiallyTimeout = null;
                    }, 160);
                }
            }},
        ], {
            committedCode: block.code,
        }));
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.block !== this.props.block && this.props.block.code !== props.block.code) {
            reHookValues(this, [{name: 'code', value: props.block.code}]);
            this.setState({committedCode: props.block.code, committingCode: false});
        }
    }
    /**
     * @access protected
     */
    componentDidMount() {
        if (!this.userCanEditCode) return;
        setFocusTo(this.codeInputEl);
        const textareaEl = this.codeInputEl.current.inputEl.current;
        window.autosize(textareaEl);
        //
        const inspEl = api.inspectorPanel.getOuterEl();
        const btnEl = this.saveBtnEl.current;
        this.adjustSaveChangesBtnEl = () => {
            if (btnEl.classList.contains('d-invisible')) return;
            const textAreaTop = textareaEl.getBoundingClientRect().top;
            const inspElTop = inspEl.getBoundingClientRect().top;
            const diff = textAreaTop - inspElTop;
            const newIs = inspEl.scrollTop > diff;
            const prevIs = btnEl.classList.contains('p-fixed');

            if (newIs && !prevIs) {
                btnEl.classList.add('p-fixed');
                btnEl.classList.remove('p-absolute');
                btnEl.style.right = null;
            } else if (!newIs && prevIs) {
                btnEl.classList.add('p-absolute');
                btnEl.classList.remove('p-fixed');
                btnEl.style.left = null;
                btnEl.style.right = saveBtnEdgeCssStr;
                btnEl.style.top = saveBtnEdgeCssStr;
            }

            if (newIs) {
                btnEl.style.top = `calc(${Math.max(textAreaTop, inspElTop)}px + .3rem)`;
                btnEl.style.left = 'calc(var(--menu-column-width-computed) - 3.36rem)';
            }
        };
        const fn = () => this.adjustSaveChangesBtnEl();
        inspEl.addEventListener('scroll', fn);
        this.unregisterScrollListner = () => { inspEl.removeEventListener('scroll', fn); };
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
        this.unregisterScrollListner();
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {committedCode, committingCode, values}) {
        const [saveBtnIsDisabled, visibilityClsStr] = this.userCanEditCode
            ? [!!committingCode, values?.code === committedCode ? ' d-invisible' : '']
            : [null, null];
        return <FormGroup>
            { this.userCanEditCode ? [
                <label htmlFor="code" class="form-label">{ __('Code') }</label>,
                <div class="p-relative">
                    <Textarea
                        vm={ this }
                        prop="code"
                        id="code"
                        class="form-input code"
                        placeholder={ `<div>${__('My code ...')}</div>` }
                        onKeyDown={ this.keyHandlers.handleKeyDown }
                        onKeyUp={ this.keyHandlers.handleKeyUp }
                        ref={ this.codeInputEl }/>
                    <button
                        onClick={ this.commitCurrentlyTypedCode.bind(this) }
                        class={ `btn btn-primary btn-sm p-absolute pt-1${visibilityClsStr}` }
                        title={ __('Save changes') }
                        disabled={ saveBtnIsDisabled }
                        style={ `right: ${saveBtnEdgeCssStr};top: ${saveBtnEdgeCssStr};opacity: .5;` }
                        ref={ this.saveBtnEl }>
                        <Icon iconId="check" className="size-xs"/>
                        <span class="ml-1">*</span>
                    </button>
                </div>,
                <InputErrors vm={ this } prop="code"/>
            ] : <div class="color-dimmed">{ __('You lack permissions to edit this content.') }</div> }
        </FormGroup>;
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    commitCurrentlyTypedCode() {
        const latest = this.state.values.code;
        if (this.state.committedCode === latest) return;
        this.setState({committingCode: true});
        this.props.emitValueChanged(latest, 'code');
    }
}

function createUndoRedoKeyPressPropagationStopperHandlers() {
    const metaKey = getMetaKey();
    const undoKey = 'z';
    let metaKeyIsPressed = false;
    return {
        /**
         * @param {KeyboardEvent} e
         */
        handleKeyDown(e) {
            if (e.key === metaKey) {
                metaKeyIsPressed = true;
            } else if (metaKeyIsPressed && e.key === undoKey) {
                e.stopPropagation();
            }
        },
        /**
         * @param {KeyboardEvent} e
         */
        handleKeyUp(e) {
            if (e.key === metaKey)
                metaKeyIsPressed = false;
        }
    };
}

export default CodeBlockEditForm;
