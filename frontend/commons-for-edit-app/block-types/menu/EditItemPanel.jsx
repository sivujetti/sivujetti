import {validationConstraints} from '../../constants.js';
import {__} from '../../edit-app-singletons.js';
import {
    FormGroupInline,
    hasErrors,
    hookForm,
    Input,
    InputErrors,
    reHookValues,
    unhookForm,
} from '../../Form.jsx';
import PickUrlInputGroup from '../../includes-internal/PickUrlInputGroup.jsx';

class EditItemPanel extends preact.Component {
    /**
     * @param {{item: MenuLink; onValueChanged: (value: string, key: keyof MenuLink) => void; done: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = hookForm(this, [
            {name: 'linkText', value: props.item.text, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Link text'),
            onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onValueChanged(value, 'text');
            }},
        ], {
            linkTo: props.item.slug,
        });
    }
    /**
     * @param {MenuLink} item
     * @access public
     */
    overrideValues(item) {
        if (item.text !== this.state.values.linkText)
            reHookValues(this, [
                {name: 'linkText', value: item.text},
            ]);
        else if (item.slug !== this.state.linkTo)
            this.setState({linkTo: item.slug});
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
    render({done}, {linkTo}) {
        return <div class="form-horizontal">
            <button
                onClick={ () => done() }
                class="btn btn-sm"
                disabled={ hasErrors(this) }
                title={ __('Done') }
                type="button">&lt;</button>
            <FormGroupInline>
                <label htmlFor="linkText" class="form-label">{ __('Link text') }</label>
                <Input vm={ this } prop="linkText" id="linkText"/>
                <InputErrors vm={ this } prop="linkText"/>
            </FormGroupInline>
                <PickUrlInputGroup linkTo={ linkTo } onUrlPicked={ normalized => {
                    this.props.onValueChanged(normalized, 'slug');
                } }/>
        </div>;
    }
}

/**
 * @typedef MenuLink
 * @prop {string} text
 * @prop {string} slug
 * @prop {string} id
 * @prop {Array<MenuLink>} children
 */

export default EditItemPanel;
