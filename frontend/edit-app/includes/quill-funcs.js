import {events} from '@sivujetti-commons-for-edit-app';
import globalData from './globalData.js';

/**
 * @returns {Array<WysiwygMiscStyleOption>}
 */
function getRegisteredQuillMiscStyleOptions() {
    return globalData.theme.miscWysiwygStyles;
}

/**
 * @param {Array<WysiwygMiscStyleOption>} newOptions
 */
function updateRegisteredQuillMiscStyleOptions(newOptions) {
    events.emit('misc-wysiwyg-styles-updated', newOptions);
    globalData.theme.miscWysiwygStyles = newOptions;
}

export {getRegisteredQuillMiscStyleOptions, updateRegisteredQuillMiscStyleOptions};
