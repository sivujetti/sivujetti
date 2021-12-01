import {__} from './commons/main.js';
import {hookForm, InputGroup, Input, InputError} from './commons/Form.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import floatingDialog from './FloatingDialog.jsx';

class ConvertBlockToGlobalBlockTreeDialog extends preact.Component {
    /**
     * @param {{blockToConvertAndStore: Block; onConfirmed: (data: RawGlobalBlockTree) => any;}} props
     */
    constructor(props) {
        super(props);
        this.state = hookForm(this, {
            name: '',
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.form.destroy();
    }
    /**
     * @access protected
     */
    render(_, {classes, errors}) {
        return <form onSubmit={ this.applyCreateGlobalBlockTree.bind(this) }>
            <div class="mb-1">{ __('Store this block globally so you can use it later in other pages?') }</div>
            <InputGroup classes={ classes.name }>
                <label class="form-label" htmlFor="name">{ __('Name') }</label>
                <Input vm={ this } name="name" id="name" placeholder={ __('e.g. Header, Footer') }
                    errorLabel={ __('Name') } validations={ [['maxLength', 92]] }/>
                <InputError error={ errors.name }/>
            </InputGroup>
            {/*todo use formbutttons*/}
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
     * @access private
     */
    applyCreateGlobalBlockTree(e) {
        if (!this.form.handleSubmit(e))
            return;
        this.props.onConfirmed({
            name: this.state.values.name,
            blocks: blockTreeUtils.mapRecursively([this.props.blockToConvertAndStore],
                                                  block => block.toRaw())
        });
        floatingDialog.close();
    }
}

export default ConvertBlockToGlobalBlockTreeDialog;
