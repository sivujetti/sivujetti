// ## import {__, stringUtils, hookForm, unhookForm, hasErrors, Input,
// ##         InputErrors, FormGroupInline, handleSubmit} from '@sivujetti-commons-for-edit-app';
// ## import {generatePushID} from '../../commons/utils.js';
// ## 
// ## class AddCategoryPanel extends preact.Component {
// ##     /**
// ##      * @param {{pageType: PageType; cssClass: String; onAddingFinished: (newCategoryPostData: {id: String; title: String; slug: String, path: String;}|null) => void; panelHeight: Number;}} props
// ##      * @access protected
// ##      */
// ##     componentWillReceiveProps(props) {
// ##         if (props.cssClass === 'reveal-from-right' && !this.formIsHooked) {
// ##             this.setState(hookForm(this, [
// ##                 {name: 'title', value: __('Category'), validations: [['required'], ['maxLength', 92]], label: __('New category name')},
// ##             ]));
// ##         } else if (props.cssClass === 'fade-to-right' && this.formIsHooked) {
// ##             unhookForm(this);
// ##         }
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillUnmount() {
// ##         unhookForm(this);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render({panelHeight, cssClass, onAddingFinished}, {values, formIsSubmittingClass}) {
// ##         const isSub = formIsSubmittingClass !== '';
// ##         return <div class={ cssClass } style={ `top: -${panelHeight + 8}px` }>{ values
// ##             ? <form onSubmit={ e => handleSubmit(this, this.AAApostNewCategoryToBackend.bind(this), e) }>
// ##                 <div class="form-horizontal pt-0">
// ##                     <FormGroupInline>
// ##                         <label htmlFor="categoryTitle" class="form-label">{ __('New category name') }</label>
// ##                         <Input vm={ this } prop="title" id="categoryTitle"/>
// ##                         <InputErrors vm={ this } prop="title"/>
// ##                     </FormGroupInline>
// ##                 </div>
// ##                 <button
// ##                     class={ `btn btn-sm mr-1${formIsSubmittingClass}` }
// ##                     type="submit"
// ##                     disabled={ hasErrors(this) || isSub }>{ __('Create category') }</button>
// ##                 <button
// ##                     onClick={ () => onAddingFinished(null) }
// ##                     class="btn btn-sm btn-link"
// ##                     type="button"
// ##                     disabled={ isSub }>{ __('Cancel') }</button>
// ##             </form>
// ##             : null
// ##         }</div>;
// ##     }
// ##     /**
// ##      * @returns {Promise<void>}
// ##      * @access private
// ##      */
// ##     AAApostNewCategoryToBackend() {
// ##         const {title} = this.state.values;
// ##         const slug = makeSlug(title);
// ##         const postData = {id: generatePushID(), title, slug, path: makePath(slug, this.props.pageType)};
// ##         this.props.onAddingFinished(postData);
// ##         return Promise.resolve(true);
// ##     }
// ## }
// ## 
// ## /**
// ##  * @param {String} title
// ##  * @returns {String}
// ##  */
// ## function makeSlug(title) {
// ##     return `/${stringUtils.slugify(title) || '-'}`;
// ## }
// ## 
// ## /**
// ##  * @param {String} slug e.g. "/my-page"
// ##  * @param {PageType} pageType
// ##  * @returns {String} e.g. "my-page/", "articles/my-article/"
// ##  */
// ## function makePath(slug, pageType) {
// ##     return `${((pageType.name === 'Pages' ? '' : pageType.slug) + slug).substring(1)}/`;
// ## }
// ## 
// ## export default AddCategoryPanel;
// ## export {makeSlug, makePath};
