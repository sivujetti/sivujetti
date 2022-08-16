import {__, hookForm, unhookForm, handleSubmit, FormGroup, Input, InputErrors,
        floatingDialog} from '@sivujetti-commons-for-edit-app';

class ConvertBlockToGlobalBlockTreeDialog extends preact.Component {
    // boundDoHandleSubmit;
    /**
     * @param {{blockToConvertAndStore: RawBlock; onConfirmed: (data: {name: String;}) => any;}} props
     */
    constructor(props) {
        super(props);
        this.setState(hookForm(this, [
            {name: 'name', value: undefined, validations: [['minLength', 1],
                ['maxLength', 92]], label: __('Name')},
        ]));
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
    render() {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <div class="mb-1">{ __('Store this content globally so you can use it later in other pages?') }</div>
            <FormGroup>
                <label htmlFor="name" class="form-label">{ __('Name') }</label>
                <Input vm={ this } prop="name" placeholder={ __('e.g. Header, Footer') }/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroup>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Convert') }</button>
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
        this.props.onConfirmed({name: this.state.values.name});
        floatingDialog.close();
        return Promise.resolve();
    }
}

export default ConvertBlockToGlobalBlockTreeDialog;
