import {__, hookForm, unhookForm, handleSubmit, FormGroup, Input, InputErrors,
        floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';

class SaveBlockAsReusableDialog extends preact.Component {
    // boundDoHandleSubmit;
    /**
     * @param {{blockToConvertAndStore: RawBlock; onConfirmed: (data: {name: String; saveAsUnique: Boolean;}) => any; userCanCreateGlobalBlockTrees: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.setState(hookForm(this, [
            {name: 'name', value: undefined, validations: [['minLength', 1],
                ['maxLength', 92]], label: __('Name')},
        ], {
            saveAsUnique: false,
        }));
        this.boundDoHandleSubmit = this.applyCreateGlobalBlockTree.bind(this);
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
    render({userCanCreateGlobalBlockTrees}, {saveAsUnique}) {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <div class="mb-1">{ __('Store this content as reusable content so you can use it later in other pages?') }</div>
            <FormGroup>
                <label htmlFor="name" class="form-label">{ __('Name') }</label>
                <Input vm={ this } prop="name" placeholder={ __('e.g. FrontPageNewsSection, Footer') }/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroup>
            { userCanCreateGlobalBlockTrees ? <FormGroup>
                <span class="form-label">{ __('Make unique') }?</span>
                <div><p class="flex-centered m-0 text-tiny color-dimmed">
                    <Icon iconId="info-circle" className="size-sm mr-2"/>
                    { __('todo7') }
                </p></div>
                <label class="form-checkbox mt-0">
                    <input
                        onClick={ e => this.setState({saveAsUnique: e.target.checked}) }
                        checked={ saveAsUnique }
                        type="checkbox"
                        class="form-input"/><i class="form-icon"></i>
                </label>
            </FormGroup> : null }
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Save as reusable') }</button>
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
    applyCreateGlobalBlockTree() {
        this.props.onConfirmed({name: this.state.values.name,
            saveAsUnique: this.state.saveAsUnique});
        floatingDialog.close();
        return Promise.resolve();
    }
}

export default SaveBlockAsReusableDialog;
