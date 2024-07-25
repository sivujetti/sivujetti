import {
    __,
    setFocusTo,
    floatingDialog,
} from '@sivujetti-commons-for-edit-app';
import toasters from '../../includes/toasters.jsx';

class CustomClassStyleEditCustomizationsDialog extends preact.Component {
    // jsonInput;
    /**
     * @param {} props
     */
    componentWillMount() {
        this.jsonInput = preact.createRef();
        const varDefs = this.props.currentSettings || [];
        this.setState({varDefsJson: JSON.stringify(varDefs, 0, 4)});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.jsonInput);
        window.autosize(this.jsonInput.current);
    }
    /**
     * @access protected
     */
    render(_, {varDefsJson}) {
        return <form onSubmit={ this.doHandleSubmit.bind(this) }>
            <div class="mb-2">{ __('...') }</div>
            <textarea
                value={ varDefsJson }
                onInput={ e => this.setState({varDefsJson: e.target.value}) }
                class="form-input"
                ref={ this.jsonInput }></textarea>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Save settings') }</button>
                <button
                    onClick={ () => floatingDialog.close() }
                    class="btn btn-link"
                    type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    doHandleSubmit(e) {
        e.preventDefault();
        let parsed;
        try {
            parsed = JSON.parse(this.state.varDefsJson);
        } catch (e) {
            parsed = e.message;
        }
        if (typeof parsed !== 'string') {
            this.props.onConfirm(parsed);
            floatingDialog.close();
        } else {
            toasters.editAppMain(parsed, 'error');
        }
    }
}

export default CustomClassStyleEditCustomizationsDialog;
