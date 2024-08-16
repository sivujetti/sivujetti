let counter = 0;

/**
 * @param {String} prefix Examples 'styleColor', 'styleLength'
 * @param {ValueInputProps} props
 * @returns {String}
 */
function createInputId(prefix, props) {
    return `${prefix}-${props.inputId || (++counter)}`;
}

export {createInputId};
