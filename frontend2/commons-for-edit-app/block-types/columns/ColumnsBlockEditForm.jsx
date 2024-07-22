import {__} from '../../edit-app-singletons.js';

class ColumnsBlockEditForm extends preact.Component {
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_) {
        return <div class="form-horizontal pt-0">
            <p class="my-2">{ __('Nothing to edit.') }</p>
        </div>;
    }
}

export default ColumnsBlockEditForm;
