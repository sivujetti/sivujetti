import {__, hookForm, unhookForm, handleSubmit, FormGroup, Input, InputErrors,
        floatingDialog} from '@sivujetti-commons-for-edit-app';
import setFocusTo from '../../block-types/auto-focusers.js';

class SaveBlockAsReusableDialog extends preact.Component {
    // boundDoHandleSubmit;
    /**
     * @param {{blockToConvertAndStore: RawBlock; onConfirmed: (data: {name: String; saveAsUnique: Boolean;}) => any; userCanCreateGlobalBlockTrees: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.nameInput = preact.createRef();
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
    componentDidMount() {
        setFocusTo(this.nameInput);
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
            <div class="mb-1">{ __('todo7') }</div>
            <FormGroup>
                <label htmlFor="name" class="form-label">{ __('Name') }</label>
                <Input vm={ this } prop="name" placeholder={ __('e.g. Text and image, Footer') } ref={ this.nameInput }/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroup>
            { userCanCreateGlobalBlockTrees ? <FormGroup>
                <span class="form-label">{ __('Type') }</span>
                <div class="button-options">
                    <label class={ `form-radio box${!saveAsUnique ? ' selected' : ''}` }>
                        <span class="d-block mb-2"><input type="radio" name="saveAsUnique" value="yes" onClick={ () => this.setState({saveAsUnique: false}) } checked={ !saveAsUnique }/><i class="form-icon"></i><b class="h4">{ __('Duplicating') }</b></span>
                        <span>{ __('todo12') }</span>
                    </label>
                    <label class={ `form-radio box${saveAsUnique ? ' selected' : ''}` }><span class="d-block mb-2">
                        <input type="radio" name="saveAsUnique" value="no" onClick={ () => this.setState({saveAsUnique: true}) } checked={ saveAsUnique }/><i class="form-icon"></i><b class="h4">{ __('Unique') }</b></span>
                        <span>{ __('todo13') }</span>
                    </label>
                </div>
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
