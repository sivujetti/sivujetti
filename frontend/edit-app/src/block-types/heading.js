import {__} from '@sivujetti-commons';
import {hookForm, InputGroup, InputError, Input, Select} from '../../../commons/Form.jsx';
import Icon from '../../../commons/Icon.jsx';
import {formValidation} from '../constants.js';

class HeadingBlockEditForm extends preact.Component {
    /**
     * @param {{block: Block; blockTree: preact.Component; onValueChanged: (newBlockData: {[key: String]: any;}) => Promise<null>; autoFocus: Boolean;}} props
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
            level: this.props.block.level,
            cssClass: this.props.block.cssClass,
        }));
    }
    /**
     * @access protected
     */
    render({block, blockTree}, {classes, errors}) {
        return <>
            <InputGroup classes={ classes.text }>
                <Input vm={ this } name="text" id="text" errorLabel={ __('Text') }
                    validations={ [['required']] } myOnChange={ this.emitChange.bind(this) } className="tight"/>
                <InputError error={ errors.text }/>
            </InputGroup>
            <InputGroup>
                <Select
                    vm={ this }
                    name="level"
                    id="level"
                    myOnChange={ this.emitChange.bind(this) }
                    className="tight">{ [1, 2, 3, 4, 5, 6].map(n =>
                        <option value={ n }>{ `<h${n}>` }</option>
                ) }</Select>
            </InputGroup>
            <InputGroup classes={ classes.cssClass }>
                <Input vm={ this } name="cssClass" id="cssClass" errorLabel={ __('Css class') }
                    validations={ [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]] } myOnChange={ this.emitChange.bind(this) } className="tight" placeholder={ __('Css class') }/>
                <InputError error={ errors.cssClass }/>
            </InputGroup>
            <a onClick={ e => (e.preventDefault(), blockTree.appendBlockToTreeAfter(block)) }
                class="btn btn-link btn-sm text-tiny with-icon-inline color-dimmed">
                <Icon iconId="plus" className="size-xs"/> { __('Add block after') }
            </a>
        </>;
    }
    /**
     * @param {Object} newState
     * @access private
     */
    emitChange(newState) {
        const v = {text: newState.values.text, level: newState.values.level, cssClass: newState.values.cssClass};
        this.props.onValueChanged(v);
        return newState;
    }
}

const initialData = {text: __('Text here'), level: 2, cssClass: ''};

export default {
    name: 'Heading',
    friendlyName: 'Heading',
    ownPropNames: Object.keys(initialData),
    initialData,
    defaultRenderer: 'sivujetti:block-auto',
    reRender({level, text, cssClass}, renderChildren) {
        return `<h${level}${cssClass? ` class="${cssClass}"` : ''}>${text}${renderChildren()}</h${level}>`;
    },
    editForm: HeadingBlockEditForm,
};
