import {__} from '@sivujetti-commons';
import {Input} from '../../../commons/Form.jsx';

class TextFieldFieldWidget extends preact.Component {
    /**
     * @param {{field: PageTypeField; parent: PageInfoBlockEditForm;}} props
     */
    render({field, parent}) {
        return <Input vm={ parent } name={ field.name } id={ field.name } errorLabel={ __(field.friendlyName) }
            validations={ [['type', 'string']] } myOnChange={ newState => parent.handleValueChanged(newState, field.name) }/>;
    }
}

const all = {
    text: TextFieldFieldWidget,
};

/**
 * @param {String} name
 * @returns {preact.Component}
 * @throws {Error}
 */
export default (name) => {
    const out = all[name];
    if (!out) throw new Error(`No renderer found for widget or datatype \`${name}\`.`);
    return out;
};
