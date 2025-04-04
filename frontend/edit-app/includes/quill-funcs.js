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
    globalData.theme.miscWysiwygStyles = newOptions;
}

export {getRegisteredQuillMiscStyleOptions, updateRegisteredQuillMiscStyleOptions};
