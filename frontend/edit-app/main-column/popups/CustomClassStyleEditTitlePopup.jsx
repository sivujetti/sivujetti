import {
    __,
    FormGroup,
    hasErrors,
    hookForm,
    Input,
    InputErrors,
    setFocusTo,
    unhookForm,
    validationConstraints,
} from '@sivujetti-commons-for-edit-app';

/** @extends {preact.Component<CustomClassStyleEditTitlePopupProps, any>} */
class CustomClassStyleEditTitlePopup extends preact.Component {
    // titleInputRef;
    /**
     * @access protected
     */
    componentWillMount() {
        this.titleInputRef = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'title', value: this.props.currentTitle, validations: [['required'],
            ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
             label: __('Style name'), onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onTitleTyped(value);
            }},
        ]));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleInputRef);
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
        return <form onSubmit={ this.applyNewTitleAndClose.bind(this) } class="pb-1">
            <FormGroup>
                <label htmlFor="styleChunkTitle" class="form-label pt-1">{ __('Style name') }</label>
                <Input vm={ this } prop="title" id="styleChunkTitle" ref={ this.titleInputRef }/>
                <InputErrors vm={ this } prop="title"/>
            </FormGroup>
            <button class="btn btn-sm px-2" type="submit" disabled={ hasErrors(this) }>Ok</button>
            <button
                onClick={ () => this.props.onSubmitOrDiscard(false) }
                class="btn btn-sm btn-link ml-1" type="button">{ __('Cancel') }</button>
        </form>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    applyNewTitleAndClose(e) {
        e.preventDefault();
        if (hasErrors(this)) return;
        this.props.onSubmitOrDiscard(true);
    }
}

/**
 * @typedef {{
 *   currentTitle: string;
 *   onTitleTyped: (newTitle: string) => void;
 *   onSubmitOrDiscard: (isSubmit: boolean) => void;
 * }} CustomClassStyleEditTitlePopupProps
 */

export default CustomClassStyleEditTitlePopup;
