import {api} from '@sivujetti-commons-for-edit-app';

class PageTypeOwnFieldsConfigurationForm extends preact.Component {
    /**
     * @access public
     * @returns {Array<PageTypeField>}
     */
    getResult() {
        try {
            return JSON.parse(this.state.fieldsJson);
        } catch (e) {
            e;
        }
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const initial = api.saveButton.getInstance().getChannelState('pageTypes').at(-1);
        this.setState({fieldsJson: JSON.stringify(initial.ownFields, 0, 4)});
    }
    /**
     * @access protected
     */
    render(_, {fieldsJson}) {
        return <textarea
            value={ fieldsJson }
            onInput={ e => this.setState({fieldsJson: e.target.value}) }
            class="form-input"
            rows="13"></textarea>;
    }
}

export default PageTypeOwnFieldsConfigurationForm;
