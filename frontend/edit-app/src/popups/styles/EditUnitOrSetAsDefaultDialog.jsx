import {__, hookForm, unhookForm, handleSubmit, FormGroup, Input, InputErrors,
        floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';
import {createUnitClass} from '../../left-column/block/VisualStyles.jsx';

class EditUnitOrSetAsDefault extends preact.Component {
    // boundDoHandleSubmit;
    /**
     * @param {{onConfirmed: (specifier: String, isDerivable: Boolean) => any; blockTypeName: String; wasEditLink: Boolean; showSpecifier: Boolean; isDerivable: Boolean; specifier?: String;}} props
     */
    constructor(props) {
        super(props);
        this.setState(hookForm(this, [
            {name: 'specifier', value: props.specifier || '', validations: [['maxLength', 120]],
                label: __('Specifier')},
        ], {
            isDerivable: props.isDerivable,
        }));
        this.boundDoHandleSubmit = this.handleSubmit.bind(this);
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
    render({blockTypeName, wasEditLink, showSpecifier}, {isDerivable}) {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            { !wasEditLink ? <div class="mb-1">{ __('todo16 %s', __(blockTypeName)) }</div> : null }
            { showSpecifier ? <FormGroup>
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
            </FormGroup> : null }
            <FormGroup>
                <label class="form-label with-icon-inline">
                    { __('Visible for non-admins') }?
                    <span
                        class="tooltip tooltip-right d-flex ml-1"
                        data-tooltip={ __('Allow non-admin users to add these\nstyles to contents in visual styles') }
                        style="margin-top: -.1rem;">
                        <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                    </span>
                </label>
                <label class="form-checkbox mt-0">
                    <input
                        onClick={ e => this.setState({isDerivable: e.target.checked}) }
                        checked={ isDerivable }
                        type="checkbox"
                        class="form-input"/><i class="form-icon"></i>
                </label>
            </FormGroup>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ !wasEditLink ? __('Set as default') : __('Save changes') }</button>
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
    handleSubmit() {
        this.props.onConfirmed(this.state.values.specifier || '', this.state.isDerivable);
        floatingDialog.close();
        return Promise.resolve();
    }
}

export default EditUnitOrSetAsDefault;
