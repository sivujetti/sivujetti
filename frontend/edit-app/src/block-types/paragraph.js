import {__} from '../../../commons/main.js';
import {hookForm, InputGroup, InputError, Input} from '../../../commons/Form.jsx';

const HARD_SHORT_TEXT_MAX_LEN = 1024;

class ParagraphBlockEditForm extends preact.Component {
    /**
     * @param {{block: Block;}} props
     */
    constructor(props) {
        super(props);
        this.state = {};
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(hookForm(this, {
            text: this.props.block.text,
        }));
    }
    /**
     * @access protected
     */
    render(_, {classes, errors}) {
        return <InputGroup classes={ classes.text }>
            <Input vm={ this } name="text" id="text" errorLabel={ __('Text') }
                validations={ [['required'], ['maxLength', HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) } className="tight"/>
            <InputError error={ errors.text }/>
        </InputGroup>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        this.props.onValueChanged({text: newState.values.text});
        return newState;
    }
}

const initialData = {text: __('Text here')};

export default {
    name: 'Paragraph',
    friendlyName: 'Paragraph',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'kuura:block-auto',
    reRender(block) {
        return `<p>${block.text}</p>`;
    },
    EditForm: ParagraphBlockEditForm,
};
