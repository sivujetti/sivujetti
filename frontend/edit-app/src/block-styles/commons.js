/**
 * {id: 'unit-1'} -> not remote
 * {id: '<pushId>'} -> not remote
 * {id: 'j-Section-unit-1'} -> is remote
 *
 * @param {ThemeStyleUnit} unit
 * @returns {Boolean}
 */
function isRemote(unit) {
    return unit.origin.length > 0 && unit.id.split('-').length > 3;
}

export {isRemote};
