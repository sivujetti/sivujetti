/**
 * @param {String} blockIdOrType
 * @param {'single-block'|'block-type'} scope = 'single-block'
 * @returns {String}
 * @access public
 */
function createSelector(blockIdOrType, scope = 'single-block') {
    return scope === 'single-block' ? `[data-block="${blockIdOrType}"]` : 'todo';
}

export {
    createSelector,
};
