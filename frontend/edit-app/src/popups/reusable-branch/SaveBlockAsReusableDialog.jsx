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
                    <button
                        onClick={ () => this.setState({saveAsUnique: false}) }
                        class={ `form-radio btn focus-default${!saveAsUnique ? ' selected' : ''}` }
                        type="button">
                        <span>
                            <input type="radio" name="saveAsUnique" checked={ !saveAsUnique } tabIndex="-1"/>
                            <i class="form-icon"></i>
                            <b class="h4">{ __('Duplicating') }</b>
                        </span>
                        <span class="color-dimmed">{ __('todo12') }</span>
                    </button>
                    <button
                        onClick={ () => this.setState({saveAsUnique: true}) }
                        class={ `form-radio btn focus-default${saveAsUnique ? ' selected' : ''}` }
                        type="button">
                        <span>
                            <input type="radio" name="saveAsUnique" checked={ saveAsUnique } tabIndex="-1"/>
                            <i class="form-icon"></i>
                            <b class="h4">{ __('Unique') }</b>
                        </span>
                        <span class="color-dimmed">{ __('todo13') }</span>
                    </button>
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
