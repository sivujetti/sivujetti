import {__, hookForm, unhookForm, handleSubmit, FormGroup, Input, InputErrors,
        floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import {createUnitClass} from '../../left-column/block/VisualStyles.jsx';

class SetUnitAsDefaultDialog extends preact.Component {
    // boundDoHandleSubmit;
    /**
     * @param {{onConfirmed: (specifier: String) => any; blockTypeName: String;}} props
     */
    constructor(props) {
        super(props);
        this.setState(hookForm(this, [
            {name: 'specifier', value: undefined, validations: [['minLength', 1],
                ['maxLength', 120]], label: __('Specifier')},
        ], {
            saveAsUnique: false,
        }));
        this.boundDoHandleSubmit = this.applySetUnitAsDefault.bind(this);
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
    render({blockTypeName}) {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <div class="mb-1">{ __('todo16 %s', __(blockTypeName)) }</div>
            <FormGroup>
                <label htmlFor="specifier" class="form-label with-icon-inline">
                    { __('Specifier') } ({ __('optional') })
                    <span
                        class="tooltip tooltip-right d-flex ml-1"
                        data-tooltip={ __('Evaluates to\n`body [specifierHere] .%s`', createUnitClass('', blockTypeName)) }
                        style="margin-top: -.1rem;">
                        <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                    </span>
                </label>
                <Input vm={ this } prop="specifier" placeholder={ __('e.g. `>`, `div`, `.j-Button >`') }/>
                <InputErrors vm={ this } prop="specifier"/>
            </FormGroup>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Set as default') }</button>
                <button
                    onClick={ () => floatingDialog.close() }
                    class="btn btn-link"
                    type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @returns {Promise<void>}
     * @access private
     */
    applySetUnitAsDefault() {
        this.props.onConfirmed(this.state.values.specifier || '');
        floatingDialog.close();
        return Promise.resolve();
    }
}

export default SetUnitAsDefaultDialog;
