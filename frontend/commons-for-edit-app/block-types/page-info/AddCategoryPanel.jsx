import {__} from '../../edit-app-singletons.js';
import {
    FormGroupInline,
    handleSubmit,
    hasErrors,
    hookForm,
    Input,
    InputErrors,
    unhookForm,
} from '../../Form.jsx';
import {generatePushID} from '../../utils.js';
import {makePath, makeSlug} from '../../local-url-utils.js';

class AddCategoryPanel extends preact.Component {
    /**
     * @param {{pageType: PageType; cssClass: string; onAddingFinished: (newCompactPage: RelPage|null) => void; panelHeight: number;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.cssClass === 'reveal-from-right' && !this.formIsHooked) {
            this.setState(hookForm(this, [
                {name: 'title', value: __('Category'), validations: [['required'], ['maxLength', 92]], label: __('New category name')},
            ]));
        } else if (props.cssClass === 'fade-to-right' && this.formIsHooked) {
            unhookForm(this);
        }
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
    render({panelHeight, cssClass, onAddingFinished}, {values, formIsSubmittingClass}) {
        const isSub = formIsSubmittingClass !== '';
        return <div class={ cssClass } style={ `top: -${panelHeight + 8}px` }>{ values
            ? <form onSubmit={ e => handleSubmit(this, this.commitNewCategory.bind(this), e) }>
                <div class="form-horizontal pt-0">
                    <FormGroupInline>
                        <label htmlFor="categoryTitle" class="form-label">{ __('New category name') }</label>
                        <Input vm={ this } prop="title" id="categoryTitle"/>
                        <InputErrors vm={ this } prop="title"/>
                    </FormGroupInline>
                </div>
                <button
                    class={ `btn btn-sm mr-1${formIsSubmittingClass}` }
                    type="submit"
                    disabled={ hasErrors(this) || isSub }>{ __('Create category') }</button>
                <button
                    onClick={ () => onAddingFinished(null) }
                    class="btn btn-sm btn-link"
                    type="button"
                    disabled={ isSub }>{ __('Cancel') }</button>
            </form>
            : null
        }</div>;
    }
    /**
     * @returns {Promise<void>}
     * @access private
     */
    commitNewCategory() {
        const {title} = this.state.values;
        const slug = makeSlug(title);
        this.props.onAddingFinished({
            id: generatePushID(),
            title,
            slug,
            path: makePath(slug, this.props.pageType),
            type: this.props.pageType.name,
        });
        return Promise.resolve(true);
    }
}

export default AddCategoryPanel;
