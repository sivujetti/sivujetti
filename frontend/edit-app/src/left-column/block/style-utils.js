/**
 * @param {String|null} id Example 'j-Section-unit-4' or 'unit-2'
 * @returns {Boolean}
 */
function isBodyRemote(id) {
    return id && id.split('-').length > 2; // normal = 'unit-<n>', body = 'j-Type-unit-<n>'
}

export {isBodyRemote};
