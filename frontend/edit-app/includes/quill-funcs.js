import {api} from '@sivujetti-commons-for-edit-app';

function getRegisteredQuillMiscStyleOptions() {
    return api.applyFilters('createWysiwygMiscClassOptions', []);
}

export {getRegisteredQuillMiscStyleOptions};