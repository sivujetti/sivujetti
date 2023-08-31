/**
 * 'unit-1' -> not body remote
 * 'j-Section-unit-1' -> is body remote
 *
 * @param {String|null} id Example 'j-Section-unit-4' or 'unit-2'
 * @returns {Boolean}
 */
function isBodyRemote(id) {
    return id && id.split('-').length > 3;
}

/**
 * @param {String} bodyUnitId Example 'j-Section-unit-1'
 * @returns {String} Example 'unit-1'
 */
function extractIdFrom(bodyUnitId) {
    const pcs = bodyUnitId.split('-'); // ['j', 'Section', 'unit', '1']
    return pcs.slice(2).join('-'); // 'unit-1'
}

export {isBodyRemote, extractIdFrom};
