// ## class PageTypeOwnFieldsConfigurationForm extends preact.Component {
// ##     /**
// ##      * @param {{fields: Array<PageTypeField>; onFieldsChanged: (newFields: Array<PageTypeField>) => void;}} props
// ##      */
// ##     constructor(props) {
// ##         super(props);
// ##         this.state = {fieldsJson: JSON.stringify(props.fields, 0, 4)};
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render(_, {fieldsJson}) {
// ##         return <div><textarea
// ##             value={ fieldsJson }
// ##             onInput={ this.handleFieldsChanged.bind(this) }
// ##             class="form-input"
// ##             rows="13"></textarea></div>;
// ##     }
// ##     /**
// ##      * @param {Event} e
// ##      * @access private
// ##      */
// ##     handleFieldsChanged(e) {
// ##         const newVal = e.target.value;
// ##         this.setState({fieldsJson: newVal});
// ##         try {
// ##             this.props.onFieldsChanged(JSON.parse(newVal));
// ##         } catch (e) {
// ##             e;
// ##         }
// ##     }
// ## }
// ## 
// ## export default PageTypeOwnFieldsConfigurationForm;
