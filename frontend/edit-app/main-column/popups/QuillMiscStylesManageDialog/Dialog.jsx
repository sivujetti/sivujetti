import {
    __,
    CrudList,
    floatingDialog,
    handleSubmit,
} from '@sivujetti-commons-for-edit-app';
import {getRegisteredQuillMiscStyleOptions} from '../../../includes/quill-funcs.js';
import EditOptionForm from './EditOptionForm.jsx';

/** @extends {preact.Component<any, any>} */
class TheDialog extends preact.Component {
    componentWillMount() {
        this.boundDoHandleSubmit = this.doHandleSubmit.bind(this);
        const options = getRegisteredQuillMiscStyleOptions();
        this.options = options.map(d => ({...d}));
    }
    /**
     * @access protected
     */
    render() {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <p class="text-prose mb-2">{
                __('Here you can define site-specific CSS classes that are available for text formatting in the Quill editor.')
            }</p>
            <div class="my-2 py-2">
                <CrudList
                    items={ this.options }
                    itemTitleKey="name"
                    onListMutated={ (updatedOptions) => {
                        if (updatedOptions.length !== this.options.length)
                            updateDialogHeight();
                        this.options = updatedOptions.map(d => ({...d}));
                    } }
                    createNewItem={ () => createOption(this.options) }
                    editForm={ EditOptionForm }
                    editFormProps={ {updateDialogHeight: () => updateDialogHeight('animate')} }
                    itemTypeFriendlyName={ __('style class') }
                    noItemsText={ __('No style classes yet') }
                    uiDensity="default"/>
            </div>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit">{ __('Save classes') }</button>
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
    async doHandleSubmit() {
        // todo
    }
}

/**
 * @param {Array<WysiwygMiscStyleOption>} currentOptions
 * @returns {WysiwygMiscStyleOption}
 * @access public
 */
function createOption(currentOptions) {
    const cssClass = `style-${getNextId(currentOptions)}`;
    return {
        cssClass,
        name: `${__('Style name')}`,
    };
}

/**
 * @param {'animate'} instructions = undefined
 */
function updateDialogHeight(instructions = undefined) {
    setTimeout(() => {
        floatingDialog.setHeight('auto', instructions);
    }, 10);
}

/**
 * @param {Array<WysiwygMiscStyleOption>} options
 * @returns {number}
 */
function getNextId(options) {
    return options.reduce((max, {cssClass}) => {
        const maybeIntAsString = cssClass.split('-')[1];
        const asInt = parseInt(maybeIntAsString, 10);
        return !isNaN(asInt) && asInt > max ? asInt : max;
    }, 0) + 1;
}

export default () => {
    floatingDialog.open(TheDialog, {
        title: __('Manage style classes'),
        height: 'auto',
        updateDialogHeightCalculatedHeight: height => height + 20,
    }, {});
};
